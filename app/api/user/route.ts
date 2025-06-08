import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/app/schema/users";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, session?.user?.email as string));

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log(result);

    // Return user details without sensitive information
    const userDetails = {
      name: result[0].name,
      email: result[0].email,
      credits: result[0].credits,
      convertCredits: result[0].convertCredits,
    };

    return NextResponse.json(userDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Error fetching user details" },
      { status: 500 }
    );
  }

  // return NextResponse.json(
  //   { message: "User details endpoint is under construction" },
  //   { status: 200 }
  // );
}
