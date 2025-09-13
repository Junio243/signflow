// lib/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          last_login?: string | null;
        };
      };

      documents: {
        Row: {
          id: string;
          user_id: string | null;
          original_pdf_name: string;
          signed_pdf_url: string | null;
          qr_code_url: string | null;
          metadata: Json | null; // guarda positions etc.
          status: 'draft' | 'signed' | 'downloaded';
          created_at: string;
          expires_at: string;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          original_pdf_name: string;
          signed_pdf_url?: string | null;
          qr_code_url?: string | null;
          metadata?: Json | null;
          status?: 'draft' | 'signed' | 'downloaded';
          created_at?: string;
          expires_at: string;
          ip_hash?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          original_pdf_name?: string;
          signed_pdf_url?: string | null;
          qr_code_url?: string | null;
          metadata?: Json | null;
          status?: 'draft' | 'signed' | 'downloaded';
          created_at?: string;
          expires_at?: string;
          ip_hash?: string | null;
        };
      };

      signatures: {
        Row: {
          id: string;
          document_id: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          image_url?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
