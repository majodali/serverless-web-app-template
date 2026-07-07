export interface PublicUser {
  userId: string;
  username: string;
  displayName: string;
  role: "admin" | "member";
  createdAt: number;
}

export interface Item {
  ownerId: string;
  itemId: string;
  title: string;
  body: string;
  createdAt: number;
}
