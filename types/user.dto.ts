// User DTO definitions

/**
 * Data transfer object for user details response
 */
export interface UserDetailsDto {
    name: string;
    email: string;
    credits: number;
    convertCredits: number;
}

/**
 * Data transfer object for user error response
 */
export interface UserErrorDto {
    error: string;
}

/**
 * Optional: Request DTO if you need to validate incoming user requests
 */
export interface UserRequestDto {
    userId?: string;
    email?: string;
}