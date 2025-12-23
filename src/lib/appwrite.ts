import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const databases = new Databases(client);

export const DB = {
  MEMBERS: process.env.APPWRITE_MEMBERS_COLLECTION_ID!,
  TEAMS: process.env.APPWRITE_TEAMS_COLLECTION_ID!,
  PROJECTS: process.env.APPWRITE_PROJECTS_COLLECTION_ID!,
  NEWS: process.env.APPWRITE_NEWS_COLLECTION_ID!,
  VOTING: process.env.APPWRITE_VOTING_COLLECTION_ID!,
  EVENTS: process.env.APPWRITE_EVENTS_COLLECTION_ID!,
  STORE_ITEMS: process.env.APPWRITE_STORE_ITEMS_COLLECTION_ID!,
  GLOBAL_SETTINGS: process.env.APPWRITE_GLOBAL_SETTINGS_COLLECTION_ID!,
};

export const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

export { Query };
