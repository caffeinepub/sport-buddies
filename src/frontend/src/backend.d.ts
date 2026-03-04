import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_header {
    value: string;
    name: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface HelicopterBooking {
    startTime: string;
    endTime: string;
    name: string;
    passengerCount: bigint;
    email: string;
    weights: string;
    notes: string;
    paymentMode: string;
    phone: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface UserProfile {
    name: string;
    primarySport: Sport;
    locationPermission: boolean;
    skillLevel: SkillLevel;
    profileComplete: boolean;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum SkillLevel {
    intermediate = "intermediate",
    beginner = "beginner",
    advanced = "advanced",
    expert = "expert"
}
export enum Sport {
    basketball = "basketball",
    swimming = "swimming",
    soccer = "soccer",
    yoga = "yoga",
    cycling = "cycling",
    tennis = "tennis",
    running = "running"
}
export interface backendInterface {
    bookHelicopter(booking: HelicopterBooking): Promise<string>;
    checkHelicopterAvailability(startTime: string, endTime: string): Promise<string>;
    completeProfile(name: string, sport: Sport, level: SkillLevel, locationPermission: boolean): Promise<UserProfile>;
    getUserProfile(): Promise<UserProfile>;
    isProfileComplete(): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
