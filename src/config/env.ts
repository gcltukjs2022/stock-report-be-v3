import * as dotenv from "dotenv";
dotenv.config();

export interface EnvironmentConfig {
  yahooApiUrl: string;
  rapidApiKey: string;
  rapidApiHost: string;
  s3BucketName?: string;
}

export function getEnvConfig(): EnvironmentConfig {
  const { YAHOO_API, RAPIDAPI_KEY, RAPIDAPI_HOST, S3_BUCKET_NAME } = process.env;

  return {
    yahooApiUrl: YAHOO_API || "",
    rapidApiKey: RAPIDAPI_KEY || "",
    rapidApiHost: RAPIDAPI_HOST || "",
    s3BucketName: S3_BUCKET_NAME,
  };
}

export function validateEnvConfig(): EnvironmentConfig {
  const config = getEnvConfig();

  if (!config.yahooApiUrl || !config.rapidApiKey || !config.rapidApiHost) {
    console.warn(
      "[Config Warning] Missing one or more required Yahoo API environment variables (YAHOO_API, RAPIDAPI_KEY, RAPIDAPI_HOST). API price fetching may fail if invoked.",
    );
  }

  return config;
}
