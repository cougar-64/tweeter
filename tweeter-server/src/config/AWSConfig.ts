// AI-assisted: see AI-ATTRIBUTION.md
import process from "node:process";

export interface AWSConfig {
  readonly region: string;
  readonly usersTableName: string;
  readonly sessionsTableName: string;
  readonly followsTableName: string;
  readonly profileImagesBucket: string;
  readonly sessionInactivitySeconds: number;
}

/** Read deployment settings at composition time, not when the module is imported. */
export function loadAWSConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env
): AWSConfig {
  const required = (name: string): string => {
    const value = environment[name]?.trim();
    if (!value) {
      throw new Error(`Missing required configuration: ${name}.`);
    }
    return value;
  };
  const minutesText = environment.SESSION_INACTIVITY_MINUTES ?? "30";
  const sessionInactivitySeconds = Number(minutesText) * 60;
  if (!/^[1-9]\d*$/.test(minutesText) || !Number.isSafeInteger(sessionInactivitySeconds)) {
    throw new Error("SESSION_INACTIVITY_MINUTES must be a positive whole number of minutes.");
  }

  return Object.freeze({
    region: required("AWS_REGION"),
    usersTableName: required("USERS_TABLE_NAME"),
    sessionsTableName: required("SESSIONS_TABLE_NAME"),
    followsTableName: required("FOLLOWS_TABLE_NAME"),
    profileImagesBucket: required("PROFILE_IMAGES_BUCKET"),
    sessionInactivitySeconds,
  });
}
