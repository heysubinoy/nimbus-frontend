import { NextRequest, NextResponse } from "next/server";
import { generateRandomFilename } from "@/app/helpers/generateRandomFilename";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { User } from "@/schema/users";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

const Bucket = process.env.BUCKET;
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await db
      .select()
      .from(User)
      .where(eq(User.email, session?.user?.email as string));

    console.log("User email:", session?.user?.email);
    console.log("User credits:", result[0]?.credits);
    if (result.length === 0) {
      db.insert(User)
        .values({
          name: session?.user?.name as string,
          email: session?.user?.email as string,
          credits: 5,
        })
        .execute();
    } else {
      if (result[0].credits < 1) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          { status: 402 }
        );
      }
      db.update(User)
        .set({ credits: result[0].credits - 1 })
        .where(eq(User.email, session?.user?.email as string))
        .execute();
    }
  } catch (error) {
    console.error("Error querying database:", error);
    return NextResponse.json(
      { error: "Error querying database" },
      { status: 500 }
    );
  }
  const formData = await request.formData();
  const files = formData.getAll("file") as File[];

  if (files.length > 0) {
    try {
      const file = files[0]; // Get the first file
      const Key = generateRandomFilename(10) + "." + file.name.split(".").pop();
      const Body = Buffer.from(await file.arrayBuffer());

      await s3.send(new PutObjectCommand({ Bucket, Key, Body }));

      return NextResponse.json(
        { url: "http://" + process.env.BACKEND_SERVER + "/" + Key },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      return NextResponse.json(
        { error: "Error uploading file" },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }
}
