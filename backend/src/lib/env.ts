// Centralised access to the environment variables the Lambdas receive from CDK.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get usersTable() {
    return required("USERS_TABLE");
  },
  get itemsTable() {
    return required("ITEMS_TABLE");
  },
  get jwtSecret() {
    return required("JWT_SECRET");
  },
  // Only set when the WebSocket module is enabled.
  get connectionsTable() {
    return required("CONNECTIONS_TABLE");
  },
  get region() {
    return process.env.AWS_REGION ?? "us-east-1";
  },
};

export const INDEXES = {
  usersByUsername: "UsernameIndex",
  connectionsByUser: "UserIndex",
} as const;
