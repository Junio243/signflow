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

      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company_name: string | null;
          cpf_cnpj: string | null;
          phone: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          company_name?: string | null;
          cpf_cnpj?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          company_name?: string | null;
          cpf_cnpj?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
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
          validation_theme_snapshot?: Json | null;
          validation_profile_id?: string | null;
          validation_requires_code?: boolean;
          validation_access_code?: string | null;
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
          validation_theme_snapshot?: Json | null;
          validation_profile_id?: string | null;
          validation_requires_code?: boolean;
          validation_access_code?: string | null;
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
          validation_theme_snapshot?: Json | null;
          validation_profile_id?: string | null;
          validation_requires_code?: boolean;
          validation_access_code?: string | null;
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

      document_signing_events: {
        Row: {
          id: string;
          document_id: string;
          signer_name: string;
          signer_reg: string | null;
          certificate_type: string | null;
          certificate_issuer: string | null;
          signer_email: string | null;
          signed_at: string;
          certificate_valid_until: string | null;
          logo_url: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          signer_name: string;
          signer_reg?: string | null;
          certificate_type?: string | null;
          certificate_issuer?: string | null;
          signer_email?: string | null;
          signed_at?: string;
          certificate_valid_until?: string | null;
          logo_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          signer_name?: string;
          signer_reg?: string | null;
          certificate_type?: string | null;
          certificate_issuer?: string | null;
          signer_email?: string | null;
          signed_at?: string;
          certificate_valid_until?: string | null;
          logo_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
