export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activation_keys: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          key: string
          period_days: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          key: string
          period_days: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          key?: string
          period_days?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          os: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          os?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          os?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_access_logs: {
        Row: {
          action: string
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          os: string | null
          session_id: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          os?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          os?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_email: string | null
          admin_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          target_record_id: string | null
          target_table: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_message_recipients: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          received_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          received_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          received_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          include_offline: boolean
          message: string
          sender_id: string
          sender_name: string
          target_type: string
          target_users: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          include_offline?: boolean
          message: string
          sender_id: string
          sender_name: string
          target_type: string
          target_users?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          include_offline?: boolean
          message?: string
          sender_id?: string
          sender_name?: string
          target_type?: string
          target_users?: string[] | null
          title?: string
        }
        Relationships: []
      }
      admin_realtime_messages: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          sender_id: string
          sender_name: string
          target_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          sender_id: string
          sender_name: string
          target_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          sender_id?: string
          sender_name?: string
          target_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_system_config: {
        Row: {
          auto_update_enabled: boolean
          backup_enabled: boolean
          backup_interval: number
          created_at: string
          employee_slot_price: number
          id: string
          log_retention: number
          maintenance_mode: boolean
          max_users: number
          server_uptime_start: string
          session_timeout: number
          system_version: string
          updated_at: string
        }
        Insert: {
          auto_update_enabled?: boolean
          backup_enabled?: boolean
          backup_interval?: number
          created_at?: string
          employee_slot_price?: number
          id?: string
          log_retention?: number
          maintenance_mode?: boolean
          max_users?: number
          server_uptime_start?: string
          session_timeout?: number
          system_version?: string
          updated_at?: string
        }
        Update: {
          auto_update_enabled?: boolean
          backup_enabled?: boolean
          backup_interval?: number
          created_at?: string
          employee_slot_price?: number
          id?: string
          log_retention?: number
          maintenance_mode?: boolean
          max_users?: number
          server_uptime_start?: string
          session_timeout?: number
          system_version?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      ai_automation_config: {
        Row: {
          ai_model: string
          ai_provider: string
          articles_per_month: number
          auto_approve_keywords: boolean
          automation_enabled: boolean
          created_at: string
          default_category_id: string | null
          gemini_api_key: string | null
          id: string
          is_ai_active: boolean
          last_discovery_at: string | null
          last_generation_at: string | null
          max_word_count: number
          min_word_count: number
          next_generation_at: string | null
          publish_hour: number
          publish_interval_days: number
          total_articles_generated: number
          updated_at: string
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          articles_per_month?: number
          auto_approve_keywords?: boolean
          automation_enabled?: boolean
          created_at?: string
          default_category_id?: string | null
          gemini_api_key?: string | null
          id?: string
          is_ai_active?: boolean
          last_discovery_at?: string | null
          last_generation_at?: string | null
          max_word_count?: number
          min_word_count?: number
          next_generation_at?: string | null
          publish_hour?: number
          publish_interval_days?: number
          total_articles_generated?: number
          updated_at?: string
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          articles_per_month?: number
          auto_approve_keywords?: boolean
          automation_enabled?: boolean
          created_at?: string
          default_category_id?: string | null
          gemini_api_key?: string | null
          id?: string
          is_ai_active?: boolean
          last_discovery_at?: string | null
          last_generation_at?: string | null
          max_word_count?: number
          min_word_count?: number
          next_generation_at?: string | null
          publish_hour?: number
          publish_interval_days?: number
          total_articles_generated?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_automation_config_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          id: string
          is_active: boolean
          name: string
          placeholders: Json
          system_prompt: string
          updated_at: string
          updated_by: string | null
          user_prompt_template: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          id?: string
          is_active?: boolean
          name: string
          placeholders?: Json
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
          user_prompt_template?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          id?: string
          is_active?: boolean
          name?: string
          placeholders?: Json
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
          user_prompt_template?: string
        }
        Relationships: []
      }
      ai_sector_config: {
        Row: {
          ai_model: string | null
          api_key: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          sector_icon: string | null
          sector_key: string
          sector_label: string
          updated_at: string | null
          use_global_key: boolean | null
        }
        Insert: {
          ai_model?: string | null
          api_key?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sector_icon?: string | null
          sector_key: string
          sector_label: string
          updated_at?: string | null
          use_global_key?: boolean | null
        }
        Update: {
          ai_model?: string | null
          api_key?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sector_icon?: string | null
          sector_key?: string
          sector_label?: string
          updated_at?: string | null
          use_global_key?: boolean | null
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          ai_model: string
          ai_provider: string
          created_at: string
          estimated_cost_usd: number | null
          feature_label: string | null
          id: string
          input_tokens: number | null
          output_tokens: number | null
          reference_id: string | null
          tokens_used: number | null
          usage_type: string
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          created_at?: string
          estimated_cost_usd?: number | null
          feature_label?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          reference_id?: string | null
          tokens_used?: number | null
          usage_type: string
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          created_at?: string
          estimated_cost_usd?: number | null
          feature_label?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          reference_id?: string | null
          tokens_used?: number | null
          usage_type?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      article_generation_log: {
        Row: {
          ai_model: string | null
          ai_provider: string
          blog_post_id: string | null
          created_at: string
          error_message: string | null
          generation_time_ms: number | null
          id: string
          status: string
          topic_id: string | null
          topic_used: string
          word_count: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_provider: string
          blog_post_id?: string | null
          created_at?: string
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          status?: string
          topic_id?: string | null
          topic_used: string
          word_count?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string
          blog_post_id?: string | null
          created_at?: string
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          status?: string
          topic_id?: string | null
          topic_used?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_generation_log_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_generation_log_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "seo_topic_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      article_jobs: {
        Row: {
          blog_post_id: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          max_retries: number
          payload: Json
          progress: number
          retry_count: number
          scheduled_at: string
          started_at: string | null
          status: string
          title: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          blog_post_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          progress?: number
          retry_count?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          title: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          blog_post_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          progress?: number
          retry_count?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      article_keywords: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          keyword: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          keyword: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          keyword?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_keywords_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      article_revenue_tracking: {
        Row: {
          article_id: string
          classification: string | null
          clicks_cta: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          insight: string | null
          last_updated: string | null
          paying_customers: number | null
          revenue_generated: number | null
          revenue_per_visitor: number | null
          signups: number | null
          views: number | null
        }
        Insert: {
          article_id: string
          classification?: string | null
          clicks_cta?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          insight?: string | null
          last_updated?: string | null
          paying_customers?: number | null
          revenue_generated?: number | null
          revenue_per_visitor?: number | null
          signups?: number | null
          views?: number | null
        }
        Update: {
          article_id?: string
          classification?: string | null
          clicks_cta?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          insight?: string | null
          last_updated?: string | null
          paying_customers?: number | null
          revenue_generated?: number | null
          revenue_per_visitor?: number | null
          signups?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_revenue_tracking_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      article_traffic_estimates: {
        Row: {
          ai_analysis_summary: string | null
          analyzed_at: string | null
          article_id: string
          classification: string | null
          created_at: string | null
          current_position: number | null
          estimated_conversion_rate: number | null
          estimated_monthly_clients: number | null
          estimated_monthly_value: number | null
          estimated_monthly_visits: number | null
          id: string
          keyword_primary: string | null
          keyword_type: string | null
          purchase_intent: string | null
          ranking_difficulty: string | null
          search_volume: string | null
          updated_at: string | null
          value_score: number | null
          visitor_profile: string | null
        }
        Insert: {
          ai_analysis_summary?: string | null
          analyzed_at?: string | null
          article_id: string
          classification?: string | null
          created_at?: string | null
          current_position?: number | null
          estimated_conversion_rate?: number | null
          estimated_monthly_clients?: number | null
          estimated_monthly_value?: number | null
          estimated_monthly_visits?: number | null
          id?: string
          keyword_primary?: string | null
          keyword_type?: string | null
          purchase_intent?: string | null
          ranking_difficulty?: string | null
          search_volume?: string | null
          updated_at?: string | null
          value_score?: number | null
          visitor_profile?: string | null
        }
        Update: {
          ai_analysis_summary?: string | null
          analyzed_at?: string | null
          article_id?: string
          classification?: string | null
          created_at?: string | null
          current_position?: number | null
          estimated_conversion_rate?: number | null
          estimated_monthly_clients?: number | null
          estimated_monthly_value?: number | null
          estimated_monthly_visits?: number | null
          id?: string
          keyword_primary?: string | null
          keyword_type?: string | null
          purchase_intent?: string | null
          ranking_difficulty?: string | null
          search_volume?: string | null
          updated_at?: string | null
          value_score?: number | null
          visitor_profile?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_traffic_estimates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          created_at: string
          id: string
          next_payment_date: string | null
          preapproval_id: string | null
          status: string
          updated_at: string
          user_email: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          next_payment_date?: string | null
          preapproval_id?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          next_payment_date?: string | null
          preapproval_id?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_featured: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          allow_indexing: boolean | null
          author_id: string | null
          canonical_url: string | null
          category_id: string | null
          content_html: string | null
          content_md: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean | null
          og_image: string | null
          pillar_page_slug: string | null
          published_at: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          sitemap_changefreq: string | null
          sitemap_priority: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          allow_indexing?: boolean | null
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          og_image?: string | null
          pillar_page_slug?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          allow_indexing?: boolean | null
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          og_image?: string | null
          pillar_page_slug?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_clients: {
        Row: {
          address: string
          cpf: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address: string
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      campaign_deliveries: {
        Row: {
          client_id: string
          created_at: string
          delivery_date: string
          id: string
          material_id: string
          period_id: string | null
          price_per_kg: number
          total_value: number
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          client_id: string
          created_at?: string
          delivery_date?: string
          id?: string
          material_id: string
          period_id?: string | null
          price_per_kg: number
          total_value: number
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          client_id?: string
          created_at?: string
          delivery_date?: string
          id?: string
          material_id?: string
          period_id?: string | null
          price_per_kg?: number
          total_value?: number
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      campaign_materials: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_per_kg: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_per_kg?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_per_kg?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_periods: {
        Row: {
          account_value: number | null
          client_id: string
          closed_at: string | null
          created_at: string
          discount_percentage: number | null
          end_date: string
          final_value: number
          id: string
          is_closed: boolean
          start_date: string
          total_accumulated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_value?: number | null
          client_id: string
          closed_at?: string | null
          created_at?: string
          discount_percentage?: number | null
          end_date: string
          final_value?: number
          id?: string
          is_closed?: boolean
          start_date: string
          total_accumulated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_value?: number | null
          client_id?: string
          closed_at?: string | null
          created_at?: string
          discount_percentage?: number | null
          end_date?: string
          final_value?: number
          id?: string
          is_closed?: boolean
          start_date?: string
          total_accumulated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_vouchers: {
        Row: {
          client_id: string
          created_at: string
          generated_at: string
          id: string
          period_id: string
          user_id: string
          voucher_data: Json
        }
        Insert: {
          client_id: string
          created_at?: string
          generated_at?: string
          id?: string
          period_id: string
          user_id: string
          voucher_data: Json
        }
        Update: {
          client_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          period_id?: string
          user_id?: string
          voucher_data?: Json
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          closing_timestamp: string | null
          created_at: string | null
          current_amount: number
          final_amount: number | null
          gross_profit: number | null
          id: string
          initial_amount: number
          net_profit: number | null
          opening_timestamp: string | null
          status: string | null
          unidade_id: string | null
          user_id: string
        }
        Insert: {
          closing_timestamp?: string | null
          created_at?: string | null
          current_amount?: number
          final_amount?: number | null
          gross_profit?: number | null
          id?: string
          initial_amount?: number
          net_profit?: number | null
          opening_timestamp?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id: string
        }
        Update: {
          closing_timestamp?: string | null
          created_at?: string | null
          current_amount?: number
          final_amount?: number | null
          gross_profit?: number | null
          id?: string
          initial_amount?: number
          net_profit?: number | null
          opening_timestamp?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers_backup_20260429: {
        Row: {
          closing_timestamp: string | null
          created_at: string | null
          current_amount: number | null
          final_amount: number | null
          gross_profit: number | null
          id: string | null
          initial_amount: number | null
          net_profit: number | null
          opening_timestamp: string | null
          status: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          closing_timestamp?: string | null
          created_at?: string | null
          current_amount?: number | null
          final_amount?: number | null
          gross_profit?: number | null
          id?: string | null
          initial_amount?: number | null
          net_profit?: number | null
          opening_timestamp?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          closing_timestamp?: string | null
          created_at?: string | null
          current_amount?: number | null
          final_amount?: number | null
          gross_profit?: number | null
          id?: string | null
          initial_amount?: number | null
          net_profit?: number | null
          opening_timestamp?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          type: string
          unidade_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type: string
          unidade_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string
          unidade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions_backup_20260429: {
        Row: {
          amount: number | null
          cash_register_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          order_id: string | null
          type: string | null
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          cash_register_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          order_id?: string | null
          type?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          cash_register_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          order_id?: string | null
          type?: string | null
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_scaler_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_articles_per_day: number | null
          min_conversion_rate: number | null
          min_revenue_threshold: number | null
          min_views_threshold: number | null
          updated_at: string | null
          variation_types: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_articles_per_day?: number | null
          min_conversion_rate?: number | null
          min_revenue_threshold?: number | null
          min_views_threshold?: number | null
          updated_at?: string | null
          variation_types?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_articles_per_day?: number | null
          min_conversion_rate?: number | null
          min_revenue_threshold?: number | null
          min_views_threshold?: number | null
          updated_at?: string | null
          variation_types?: string[] | null
        }
        Relationships: []
      }
      content_snapshots: {
        Row: {
          action_id: string | null
          article_id: string
          content_html: string | null
          content_md: string | null
          created_at: string
          id: string
          seo_description: string | null
          seo_title: string | null
          tags: string[] | null
          title: string | null
        }
        Insert: {
          action_id?: string | null
          article_id: string
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          action_id?: string | null
          article_id?: string
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_snapshots_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "growth_engine_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_snapshots_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_versions: {
        Row: {
          content_id: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          is_published: boolean | null
          publish_note: string | null
          published_at: string | null
          version_number: number
        }
        Insert: {
          content_id?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          data: Json
          id?: string
          is_published?: boolean | null
          publish_note?: string | null
          published_at?: string | null
          version_number: number
        }
        Update: {
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          is_published?: boolean | null
          publish_note?: string | null
          published_at?: string | null
          version_number?: number
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          article_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          revenue_value: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          revenue_value?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          revenue_value?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_ab_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          session_id: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          session_id?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          session_id?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copy_ab_events_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "copy_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_variations: {
        Row: {
          clicks: number | null
          content: string
          conversion_rate: number | null
          conversions: number | null
          created_at: string | null
          element_type: string
          id: string
          impressions: number | null
          is_active: boolean | null
          is_winner: boolean | null
          profile_type: string
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          content: string
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          element_type: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          is_winner?: boolean | null
          profile_type: string
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          content?: string
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          element_type?: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          is_winner?: boolean | null
          profile_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          unidade_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          unidade_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          unidade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      depot_clients: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_number: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          total_orders: number | null
          total_spent: number | null
          unidade_id: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          total_orders?: number | null
          total_spent?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp: string
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          total_orders?: number | null
          total_spent?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "depot_clients_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      depot_employees: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          email: string
          employee_user_id: string | null
          id: string
          initial_password_set: boolean | null
          is_active: boolean | null
          last_login_at: string | null
          name: string
          notes: string | null
          owner_user_id: string
          password_changed_at: string | null
          phone: string | null
          role: string | null
          salary: number | null
          unidade_id: string | null
          updated_at: string | null
          work_days: number[] | null
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          email: string
          employee_user_id?: string | null
          id?: string
          initial_password_set?: boolean | null
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          notes?: string | null
          owner_user_id: string
          password_changed_at?: string | null
          phone?: string | null
          role?: string | null
          salary?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          email?: string
          employee_user_id?: string | null
          id?: string
          initial_password_set?: boolean | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          notes?: string | null
          owner_user_id?: string
          password_changed_at?: string | null
          phone?: string | null
          role?: string | null
          salary?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depot_employees_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_action_logs: {
        Row: {
          action_detail: string | null
          action_type: string
          created_at: string
          employee_name: string
          employee_user_id: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          owner_user_id: string
        }
        Insert: {
          action_detail?: string | null
          action_type: string
          created_at?: string
          employee_name: string
          employee_user_id: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          owner_user_id: string
        }
        Update: {
          action_detail?: string | null
          action_type?: string
          created_at?: string
          employee_name?: string
          employee_user_id?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          owner_user_id?: string
        }
        Relationships: []
      }
      employee_permissions: {
        Row: {
          employee_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
        }
        Insert: {
          employee_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
        }
        Update: {
          employee_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "depot_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_slots: {
        Row: {
          activated_at: string
          amount_paid: number
          created_at: string
          employee_id: string | null
          expires_at: string
          id: string
          is_active: boolean
          owner_user_id: string
          payment_reference: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          amount_paid: number
          created_at?: string
          employee_id?: string | null
          expires_at: string
          id?: string
          is_active?: boolean
          owner_user_id: string
          payment_reference: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          amount_paid?: number
          created_at?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          owner_user_id?: string
          payment_reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_slots_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "depot_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_slots_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_reports: {
        Row: {
          created_at: string
          error_description: string
          error_title: string
          error_type: string
          id: string
          is_read: boolean
          read_at: string | null
          read_by: string | null
          reproduce_steps: string | null
          updated_at: string
          user_email: string
          user_id: string
          user_whatsapp: string | null
        }
        Insert: {
          created_at?: string
          error_description: string
          error_title: string
          error_type: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          reproduce_steps?: string | null
          updated_at?: string
          user_email: string
          user_id: string
          user_whatsapp?: string | null
        }
        Update: {
          created_at?: string
          error_description?: string
          error_title?: string
          error_type?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          reproduce_steps?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string
          user_whatsapp?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled_for_users: string[] | null
          enabled_percentage: number | null
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled_for_users?: string[] | null
          enabled_percentage?: number | null
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled_for_users?: string[] | null
          enabled_percentage?: number | null
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fiscal_settings: {
        Row: {
          ambiente: string | null
          api_empresa_id: string | null
          api_token: string | null
          bairro: string | null
          cep: string | null
          certificado_senha: string | null
          certificado_url: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          id: string
          inscricao_estadual: string | null
          logradouro: string | null
          nome_fantasia: string | null
          numero: string | null
          proximo_numero_nfe: number | null
          razao_social: string | null
          regime_tributario: string | null
          serie_nfe: number | null
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ambiente?: string | null
          api_empresa_id?: string | null
          api_token?: string | null
          bairro?: string | null
          cep?: string | null
          certificado_senha?: string | null
          certificado_url?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          proximo_numero_nfe?: number | null
          razao_social?: string | null
          regime_tributario?: string | null
          serie_nfe?: number | null
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ambiente?: string | null
          api_empresa_id?: string | null
          api_token?: string | null
          bairro?: string | null
          cep?: string | null
          certificado_senha?: string | null
          certificado_url?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          proximo_numero_nfe?: number | null
          razao_social?: string | null
          regime_tributario?: string | null
          serie_nfe?: number | null
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_landing_settings: {
        Row: {
          background_image_url: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          footer_text: string
          hero_badge_text: string
          hero_button_text: string
          hero_description: string
          hero_main_title: string
          hero_subtitle: string
          id: string
          logo_url: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          testimonials: string | null
          updated_at: string
          user_id: string | null
          video_bullets: string | null
          video_enabled: boolean | null
          video_poster_url: string | null
          video_subtitle: string | null
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          background_image_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          updated_at?: string
          user_id?: string | null
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          background_image_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          updated_at?: string
          user_id?: string | null
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      global_notification_recipients: {
        Row: {
          id: string
          notification_id: string
          received_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          received_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          received_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "global_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      global_notifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          message: string
          sender_id: string
          sender_name: string
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          message: string
          sender_id: string
          sender_name: string
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          message?: string
          sender_id?: string
          sender_name?: string
          title?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          allow_indexing: boolean | null
          canonical_url: string | null
          created_at: string
          examples: string | null
          id: string
          long_definition: string | null
          related_links: Json | null
          related_terms: string[] | null
          seo_description: string | null
          seo_title: string | null
          short_definition: string
          sitemap_changefreq: string | null
          sitemap_priority: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          term: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          allow_indexing?: boolean | null
          canonical_url?: string | null
          created_at?: string
          examples?: string | null
          id?: string
          long_definition?: string | null
          related_links?: Json | null
          related_terms?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          short_definition: string
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          term: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          allow_indexing?: boolean | null
          canonical_url?: string | null
          created_at?: string
          examples?: string | null
          id?: string
          long_definition?: string | null
          related_links?: Json | null
          related_terms?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          short_definition?: string
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          term?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      growth_engine_actions: {
        Row: {
          action_reason: string | null
          action_type: string
          article_id: string | null
          article_title: string | null
          created_at: string
          error_message: string | null
          executed_at: string | null
          id: string
          priority: string | null
          ranking_after: number | null
          ranking_before: number | null
          result_summary: string | null
          reviewed_at: string | null
          status: string
          views_after: number | null
          views_before: number | null
        }
        Insert: {
          action_reason?: string | null
          action_type: string
          article_id?: string | null
          article_title?: string | null
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          priority?: string | null
          ranking_after?: number | null
          ranking_before?: number | null
          result_summary?: string | null
          reviewed_at?: string | null
          status?: string
          views_after?: number | null
          views_before?: number | null
        }
        Update: {
          action_reason?: string | null
          action_type?: string
          article_id?: string | null
          article_title?: string | null
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          priority?: string | null
          ranking_after?: number | null
          ranking_before?: number | null
          result_summary?: string | null
          reviewed_at?: string | null
          status?: string
          views_after?: number | null
          views_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_engine_actions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_engine_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_run_at: string | null
          max_actions_per_day: number
          max_new_articles_per_day: number
          max_rewrites_per_day: number
          mode: string
          next_run_at: string | null
          protect_high_conversion: boolean
          protect_top5: boolean
          run_interval_hours: number
          total_actions_executed: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          max_actions_per_day?: number
          max_new_articles_per_day?: number
          max_rewrites_per_day?: number
          mode?: string
          next_run_at?: string | null
          protect_high_conversion?: boolean
          protect_top5?: boolean
          run_interval_hours?: number
          total_actions_executed?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          max_actions_per_day?: number
          max_new_articles_per_day?: number
          max_rewrites_per_day?: number
          mode?: string
          next_run_at?: string | null
          protect_high_conversion?: boolean
          protect_top5?: boolean
          run_interval_hours?: number
          total_actions_executed?: number
          updated_at?: string
        }
        Relationships: []
      }
      growth_engine_learnings: {
        Row: {
          action_type: string
          article_id: string | null
          created_at: string
          details: string | null
          id: string
          metric_after: number | null
          metric_before: number | null
          metric_changed: string | null
          outcome: string
        }
        Insert: {
          action_type: string
          article_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          metric_after?: number | null
          metric_before?: number | null
          metric_changed?: string | null
          outcome: string
        }
        Update: {
          action_type?: string
          article_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          metric_after?: number | null
          metric_before?: number | null
          metric_changed?: string | null
          outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_engine_learnings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_page_settings: {
        Row: {
          badge_text: string
          created_at: string | null
          cta_button_text: string
          cta_subtitle: string
          cta_title: string
          feature1_subtitle: string
          feature1_title: string
          feature2_subtitle: string
          feature2_title: string
          feature3_subtitle: string
          feature3_title: string
          id: string
          main_title: string
          subtitle: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_text?: string
          created_at?: string | null
          cta_button_text?: string
          cta_subtitle?: string
          cta_title?: string
          feature1_subtitle?: string
          feature1_title?: string
          feature2_subtitle?: string
          feature2_title?: string
          feature3_subtitle?: string
          feature3_title?: string
          id?: string
          main_title?: string
          subtitle?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_text?: string
          created_at?: string | null
          cta_button_text?: string
          cta_subtitle?: string
          cta_title?: string
          feature1_subtitle?: string
          feature1_title?: string
          feature2_subtitle?: string
          feature2_title?: string
          feature3_subtitle?: string
          feature3_title?: string
          id?: string
          main_title?: string
          subtitle?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guide_videos: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          duration: string | null
          id: string
          is_active: boolean | null
          order_position: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          youtube_video_id: string | null
        }
        Insert: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          youtube_video_id?: string | null
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          allow_indexing: boolean | null
          canonical_url: string | null
          category_id: string | null
          content_html: string | null
          content_md: string | null
          created_at: string
          excerpt: string | null
          id: string
          module: Database["public"]["Enums"]["system_module"] | null
          og_image: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          sitemap_changefreq: string | null
          sitemap_priority: number | null
          slug: string
          sort_order: number | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          video_thumbnail: string | null
          video_url: string | null
          view_count: number | null
          youtube_video_id: string | null
        }
        Insert: {
          allow_indexing?: boolean | null
          canonical_url?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          og_image?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          video_thumbnail?: string | null
          video_url?: string | null
          view_count?: number | null
          youtube_video_id?: string | null
        }
        Update: {
          allow_indexing?: boolean | null
          canonical_url?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          og_image?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          video_thumbnail?: string | null
          video_url?: string | null
          view_count?: number | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          module: Database["public"]["Enums"]["system_module"] | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      image_studio_prompts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          prompt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          prompt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      index_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          url: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          url: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          url?: string
        }
        Relationships: []
      }
      index_tracking: {
        Row: {
          action_taken: string | null
          article_id: string | null
          check_attempts: number | null
          created_at: string | null
          days_without_index: number | null
          first_detected: string | null
          id: string
          last_checked: string | null
          last_indexed_at: string | null
          needs_action: boolean | null
          page_type: string | null
          priority: string | null
          status: string | null
          url: string
        }
        Insert: {
          action_taken?: string | null
          article_id?: string | null
          check_attempts?: number | null
          created_at?: string | null
          days_without_index?: number | null
          first_detected?: string | null
          id?: string
          last_checked?: string | null
          last_indexed_at?: string | null
          needs_action?: boolean | null
          page_type?: string | null
          priority?: string | null
          status?: string | null
          url: string
        }
        Update: {
          action_taken?: string | null
          article_id?: string | null
          check_attempts?: number | null
          created_at?: string | null
          days_without_index?: number | null
          first_detected?: string | null
          id?: string
          last_checked?: string | null
          last_indexed_at?: string | null
          needs_action?: boolean | null
          page_type?: string | null
          priority?: string | null
          status?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "index_tracking_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_opportunities: {
        Row: {
          added_to_bank_at: string | null
          category: string
          competition_level: number | null
          created_at: string | null
          discovered_at: string | null
          existing_article_id: string | null
          has_existing_article: boolean | null
          id: string
          intent: string | null
          is_added_to_bank: boolean | null
          keyword: string
          notes: string | null
          opportunity_score: number | null
          purchase_intent: number | null
          source: string | null
          status: string | null
          suggested_slug: string | null
          suggested_title: string | null
          topic_bank_id: string | null
          traffic_potential: number | null
          updated_at: string | null
          variations: string[] | null
        }
        Insert: {
          added_to_bank_at?: string | null
          category?: string
          competition_level?: number | null
          created_at?: string | null
          discovered_at?: string | null
          existing_article_id?: string | null
          has_existing_article?: boolean | null
          id?: string
          intent?: string | null
          is_added_to_bank?: boolean | null
          keyword: string
          notes?: string | null
          opportunity_score?: number | null
          purchase_intent?: number | null
          source?: string | null
          status?: string | null
          suggested_slug?: string | null
          suggested_title?: string | null
          topic_bank_id?: string | null
          traffic_potential?: number | null
          updated_at?: string | null
          variations?: string[] | null
        }
        Update: {
          added_to_bank_at?: string | null
          category?: string
          competition_level?: number | null
          created_at?: string | null
          discovered_at?: string | null
          existing_article_id?: string | null
          has_existing_article?: boolean | null
          id?: string
          intent?: string | null
          is_added_to_bank?: boolean | null
          keyword?: string
          notes?: string | null
          opportunity_score?: number | null
          purchase_intent?: number | null
          source?: string | null
          status?: string | null
          suggested_slug?: string | null
          suggested_title?: string | null
          topic_bank_id?: string | null
          traffic_potential?: number | null
          updated_at?: string | null
          variations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_opportunities_existing_article_id_fkey"
            columns: ["existing_article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_opportunities_topic_bank_id_fkey"
            columns: ["topic_bank_id"]
            isOneToOne: false
            referencedRelation: "seo_topic_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_cta_final: {
        Row: {
          button_text: string
          button_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          main_text: string
          notes: string | null
          sub_text: string | null
          updated_at: string | null
        }
        Insert: {
          button_text: string
          button_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          main_text: string
          notes?: string | null
          sub_text?: string | null
          updated_at?: string | null
        }
        Update: {
          button_text?: string
          button_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          main_text?: string
          notes?: string | null
          sub_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_faq: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_footer_settings: {
        Row: {
          copyright_text: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          links: Json | null
          security_badges: Json | null
          show_social_links: boolean | null
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          copyright_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          links?: Json | null
          security_badges?: Json | null
          show_social_links?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          copyright_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          links?: Json | null
          security_badges?: Json | null
          show_social_links?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_how_it_works: {
        Row: {
          created_at: string | null
          description: string
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          step_number: number
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          step_number: number
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          step_number?: number
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      landing_kpis: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      landing_page_settings: {
        Row: {
          author: string | null
          background_image_url: string | null
          canonical_url: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          favicon_url: string | null
          footer_text: string
          hero_badge_text: string
          hero_button_text: string
          hero_description: string
          hero_highlight_text: string | null
          hero_image_alt: string | null
          hero_image_size_desktop: string | null
          hero_image_size_mobile: string | null
          hero_image_size_tablet: string | null
          hero_image_url: string | null
          hero_main_title: string
          hero_media_type: string | null
          hero_secondary_button_text: string | null
          hero_security_label: string | null
          hero_social_proof_rating: string | null
          hero_social_proof_rating_label: string | null
          hero_social_proof_users: string | null
          hero_social_proof_users_label: string | null
          hero_subtitle: string
          hero_video_inline: boolean | null
          hero_video_type: string | null
          hero_video_url: string | null
          id: string
          json_ld_data: string | null
          logo_url: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          robots_directive: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          testimonials: string | null
          twitter_card: string | null
          updated_at: string
          user_id: string
          video_bullets: string | null
          video_enabled: boolean | null
          video_poster_url: string | null
          video_subtitle: string | null
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          author?: string | null
          background_image_url?: string | null
          canonical_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_highlight_text?: string | null
          hero_image_alt?: string | null
          hero_image_size_desktop?: string | null
          hero_image_size_mobile?: string | null
          hero_image_size_tablet?: string | null
          hero_image_url?: string | null
          hero_main_title?: string
          hero_media_type?: string | null
          hero_secondary_button_text?: string | null
          hero_security_label?: string | null
          hero_social_proof_rating?: string | null
          hero_social_proof_rating_label?: string | null
          hero_social_proof_users?: string | null
          hero_social_proof_users_label?: string | null
          hero_subtitle?: string
          hero_video_inline?: boolean | null
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          json_ld_data?: string | null
          logo_url?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          robots_directive?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          twitter_card?: string | null
          updated_at?: string
          user_id: string
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          author?: string | null
          background_image_url?: string | null
          canonical_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_highlight_text?: string | null
          hero_image_alt?: string | null
          hero_image_size_desktop?: string | null
          hero_image_size_mobile?: string | null
          hero_image_size_tablet?: string | null
          hero_image_url?: string | null
          hero_main_title?: string
          hero_media_type?: string | null
          hero_secondary_button_text?: string | null
          hero_security_label?: string | null
          hero_social_proof_rating?: string | null
          hero_social_proof_rating_label?: string | null
          hero_social_proof_users?: string | null
          hero_social_proof_users_label?: string | null
          hero_subtitle?: string
          hero_video_inline?: boolean | null
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          json_ld_data?: string | null
          logo_url?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          robots_directive?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          twitter_card?: string | null
          updated_at?: string
          user_id?: string
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      landing_problems: {
        Row: {
          created_at: string | null
          description: string
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          loss_value: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          loss_value: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          loss_value?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_requirements: {
        Row: {
          created_at: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_sections: {
        Row: {
          background_class: string | null
          created_at: string | null
          display_order: number
          id: string
          is_visible: boolean | null
          section_key: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          background_class?: string | null
          created_at?: string | null
          display_order: number
          id?: string
          is_visible?: boolean | null
          section_key: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          background_class?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean | null
          section_key?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_testimonials: {
        Row: {
          company: string | null
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          photo_url: string | null
          rating: number | null
          revenue: string | null
          text: string
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          photo_url?: string | null
          rating?: number | null
          revenue?: string | null
          text: string
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          photo_url?: string | null
          rating?: number | null
          revenue?: string | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_videos: {
        Row: {
          column_position: number | null
          created_at: string | null
          description: string | null
          display_order: number
          duration: string | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_file_url: string | null
          video_type: string | null
          video_url: string
        }
        Insert: {
          column_position?: number | null
          created_at?: string | null
          description?: string | null
          display_order: number
          duration?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_file_url?: string | null
          video_type?: string | null
          video_url: string
        }
        Update: {
          column_position?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          duration?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_file_url?: string | null
          video_type?: string | null
          video_url?: string
        }
        Relationships: []
      }
      local_seo_cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_capital: boolean
          name: string
          population_rank: number
          slug: string
          state_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_capital?: boolean
          name: string
          population_rank?: number
          slug: string
          state_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_capital?: boolean
          name?: string
          population_rank?: number
          slug?: string
          state_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_seo_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "local_seo_states"
            referencedColumns: ["id"]
          },
        ]
      }
      local_seo_pages: {
        Row: {
          allow_indexing: boolean
          canonical_url: string
          city_id: string | null
          content_html: string
          created_at: string
          faq: Json | null
          features: Json | null
          headline: string
          id: string
          og_image: string | null
          page_type: string
          schema_data: Json | null
          seo_description: string
          seo_title: string
          sitemap_changefreq: string
          sitemap_priority: number
          slug: string
          state_id: string
          status: string
          subheadline: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          allow_indexing?: boolean
          canonical_url: string
          city_id?: string | null
          content_html: string
          created_at?: string
          faq?: Json | null
          features?: Json | null
          headline: string
          id?: string
          og_image?: string | null
          page_type: string
          schema_data?: Json | null
          seo_description: string
          seo_title: string
          sitemap_changefreq?: string
          sitemap_priority?: number
          slug: string
          state_id: string
          status?: string
          subheadline?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          allow_indexing?: boolean
          canonical_url?: string
          city_id?: string | null
          content_html?: string
          created_at?: string
          faq?: Json | null
          features?: Json | null
          headline?: string
          id?: string
          og_image?: string | null
          page_type?: string
          schema_data?: Json | null
          seo_description?: string
          seo_title?: string
          sitemap_changefreq?: string
          sitemap_priority?: number
          slug?: string
          state_id?: string
          status?: string
          subheadline?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "local_seo_pages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "local_seo_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_seo_pages_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "local_seo_states"
            referencedColumns: ["id"]
          },
        ]
      }
      local_seo_states: {
        Row: {
          abbreviation: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_notices: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          message: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          message: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_categories: {
        Row: {
          color: string
          created_at: string
          display_order: number
          hex_color: string | null
          id: string
          is_active: boolean
          is_required: boolean
          is_system: boolean
          name: string
          system_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          hex_color?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_system?: boolean
          name: string
          system_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          hex_color?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_system?: boolean
          name?: string
          system_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      material_price_history: {
        Row: {
          change_type: string | null
          changed_at: string
          id: string
          material_id: string
          material_name: string
          new_price: number
          new_sale_price: number
          old_price: number | null
          old_sale_price: number | null
          user_id: string
        }
        Insert: {
          change_type?: string | null
          changed_at?: string
          id?: string
          material_id: string
          material_name: string
          new_price: number
          new_sale_price: number
          old_price?: number | null
          old_sale_price?: number | null
          user_id: string
        }
        Update: {
          change_type?: string | null
          changed_at?: string
          id?: string
          material_id?: string
          material_name?: string
          new_price?: number
          new_sale_price?: number
          old_price?: number | null
          old_sale_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_price_history_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          previous_price: number | null
          previous_sale_price: number | null
          price: number
          sale_price: number
          unidade_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          previous_price?: number | null
          previous_sale_price?: number | null
          price?: number
          sale_price?: number
          unidade_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          previous_price?: number | null
          previous_sale_price?: number | null
          price?: number
          sale_price?: number
          unidade_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      mercado_pago_payments: {
        Row: {
          campaign_id: string | null
          created_at: string
          external_reference: string | null
          followup_1h_sent: boolean | null
          followup_24h_sent: boolean | null
          followup_48h_sent: boolean | null
          id: string
          payer_email: string
          payment_id: string
          payment_method_id: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: string
          status_detail: string | null
          ticket_url: string | null
          transaction_amount: number
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          external_reference?: string | null
          followup_1h_sent?: boolean | null
          followup_24h_sent?: boolean | null
          followup_48h_sent?: boolean | null
          id?: string
          payer_email: string
          payment_id: string
          payment_method_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status: string
          status_detail?: string | null
          ticket_url?: string | null
          transaction_amount: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          external_reference?: string | null
          followup_1h_sent?: boolean | null
          followup_24h_sent?: boolean | null
          followup_48h_sent?: boolean | null
          id?: string
          payer_email?: string
          payment_id?: string
          payment_method_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string
          status_detail?: string | null
          ticket_url?: string | null
          transaction_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mercado_pago_payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      order_cancellations: {
        Row: {
          cancellation_reason: string
          cancelled_at: string
          cancelled_by: string
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          cancellation_reason: string
          cancelled_at?: string
          cancelled_by: string
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string
          cancelled_at?: string
          cancelled_by?: string
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          material_id: string | null
          material_name: string
          order_id: string
          original_price: number | null
          price: number
          price_adjustment: number | null
          quantity: number
          tara: number | null
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id?: string | null
          material_name: string
          order_id: string
          original_price?: number | null
          price: number
          price_adjustment?: number | null
          quantity: number
          tara?: number | null
          total: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string | null
          material_name?: string
          order_id?: string
          original_price?: number | null
          price?: number
          price_adjustment?: number | null
          quantity?: number
          tara?: number | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items_backup_20260429: {
        Row: {
          created_at: string | null
          id: string | null
          material_id: string | null
          material_name: string | null
          order_id: string | null
          original_price: number | null
          price: number | null
          price_adjustment: number | null
          quantity: number | null
          tara: number | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          material_id?: string | null
          material_name?: string | null
          order_id?: string | null
          original_price?: number | null
          price?: number | null
          price_adjustment?: number | null
          quantity?: number | null
          tara?: number | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          material_id?: string | null
          material_name?: string | null
          order_id?: string | null
          original_price?: number | null
          price?: number | null
          price_adjustment?: number | null
          quantity?: number | null
          tara?: number | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_payment_details: {
        Row: {
          created_at: string
          id: string
          order_id: string
          payment_method: string
          pix_key_type: string | null
          pix_key_value: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_payments: {
        Row: {
          created_at: string
          id: string
          order_id: string
          payment_method: string
          pix_key_type: string | null
          pix_key_value: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reprints: {
        Row: {
          created_at: string
          id: string
          last_reprint_at: string | null
          order_id: string
          reprint_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reprint_at?: string | null
          order_id: string
          reprint_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reprint_at?: string | null
          order_id?: string
          reprint_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled: boolean | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          customer_id: string
          depot_client_id: string | null
          id: string
          payment_method: string | null
          payment_method_type: string | null
          payment_status: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          receipt_saved: boolean | null
          receipt_saved_at: string | null
          status: string | null
          total: number
          type: string
          unidade_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id: string
          depot_client_id?: string | null
          id?: string
          payment_method?: string | null
          payment_method_type?: string | null
          payment_status?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          receipt_saved?: boolean | null
          receipt_saved_at?: string | null
          status?: string | null
          total?: number
          type: string
          unidade_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id?: string
          depot_client_id?: string | null
          id?: string
          payment_method?: string | null
          payment_method_type?: string | null
          payment_status?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          receipt_saved?: boolean | null
          receipt_saved_at?: string | null
          status?: string | null
          total?: number
          type?: string
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_depot_client_id_fkey"
            columns: ["depot_client_id"]
            isOneToOne: false
            referencedRelation: "depot_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_backup_20260429: {
        Row: {
          cancellation_reason: string | null
          cancelled: boolean | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          customer_id: string | null
          depot_client_id: string | null
          id: string | null
          payment_method: string | null
          payment_method_type: string | null
          payment_status: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          receipt_saved: boolean | null
          receipt_saved_at: string | null
          status: string | null
          total: number | null
          type: string | null
          unidade_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          depot_client_id?: string | null
          id?: string | null
          payment_method?: string | null
          payment_method_type?: string | null
          payment_status?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          receipt_saved?: boolean | null
          receipt_saved_at?: string | null
          status?: string | null
          total?: number | null
          type?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          depot_client_id?: string | null
          id?: string | null
          payment_method?: string | null
          payment_method_type?: string | null
          payment_status?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          receipt_saved?: boolean | null
          receipt_saved_at?: string | null
          status?: string | null
          total?: number | null
          type?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_gateway_config: {
        Row: {
          access_token_configured: boolean | null
          access_token_encrypted: string | null
          card_enabled: boolean | null
          created_at: string | null
          environment: string | null
          gateway_name: string
          id: string
          is_active: boolean | null
          last_test_at: string | null
          last_test_status: string | null
          max_installments: number | null
          min_installment_value: number | null
          notification_email: string | null
          notify_on_approval: boolean | null
          notify_on_failure: boolean | null
          pix_enabled: boolean | null
          public_key: string | null
          updated_at: string | null
          webhook_secret: string | null
          webhook_secret_configured: boolean | null
          webhook_url: string | null
        }
        Insert: {
          access_token_configured?: boolean | null
          access_token_encrypted?: string | null
          card_enabled?: boolean | null
          created_at?: string | null
          environment?: string | null
          gateway_name?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          max_installments?: number | null
          min_installment_value?: number | null
          notification_email?: string | null
          notify_on_approval?: boolean | null
          notify_on_failure?: boolean | null
          pix_enabled?: boolean | null
          public_key?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_secret_configured?: boolean | null
          webhook_url?: string | null
        }
        Update: {
          access_token_configured?: boolean | null
          access_token_encrypted?: string | null
          card_enabled?: boolean | null
          created_at?: string | null
          environment?: string | null
          gateway_name?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          max_installments?: number | null
          min_installment_value?: number | null
          notification_email?: string | null
          notify_on_approval?: boolean | null
          notify_on_failure?: boolean | null
          pix_enabled?: boolean | null
          public_key?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_secret_configured?: boolean | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_ledger: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          operation_type: string
          provider: string
          provider_event_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          operation_type: string
          provider: string
          provider_event_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          provider?: string
          provider_event_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pdv_access_config: {
        Row: {
          created_at: string
          extra_slots_purchased: number
          id: string
          max_concurrent_slots: number
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          extra_slots_purchased?: number
          id?: string
          max_concurrent_slots?: number
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          extra_slots_purchased?: number
          id?: string
          max_concurrent_slots?: number
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdv_sessions: {
        Row: {
          device_id: string | null
          device_info: string | null
          employee_user_id: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_heartbeat: string
          owner_user_id: string
          session_token: string
          started_at: string
        }
        Insert: {
          device_id?: string | null
          device_info?: string | null
          employee_user_id: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_heartbeat?: string
          owner_user_id: string
          session_token: string
          started_at?: string
        }
        Update: {
          device_id?: string | null
          device_info?: string | null
          employee_user_id?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_heartbeat?: string
          owner_user_id?: string
          session_token?: string
          started_at?: string
        }
        Relationships: []
      }
      pillar_pages: {
        Row: {
          allow_indexing: boolean | null
          benefits: Json | null
          canonical_url: string | null
          created_at: string
          cta_primary_text: string | null
          cta_primary_url: string | null
          cta_secondary_text: string | null
          cta_secondary_url: string | null
          faq: Json | null
          features: Json | null
          headline: string
          hero_image: string | null
          how_it_works: Json | null
          id: string
          intro_text: string | null
          og_image: string | null
          sections: Json | null
          seo_description: string | null
          seo_title: string | null
          sitemap_changefreq: string | null
          sitemap_priority: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subheadline: string | null
          testimonials: Json | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          allow_indexing?: boolean | null
          benefits?: Json | null
          canonical_url?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          faq?: Json | null
          features?: Json | null
          headline: string
          hero_image?: string | null
          how_it_works?: Json | null
          id?: string
          intro_text?: string | null
          og_image?: string | null
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subheadline?: string | null
          testimonials?: Json | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          allow_indexing?: boolean | null
          benefits?: Json | null
          canonical_url?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          faq?: Json | null
          features?: Json | null
          headline?: string
          hero_image?: string | null
          how_it_works?: Json | null
          id?: string
          intro_text?: string | null
          og_image?: string | null
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subheadline?: string | null
          testimonials?: Json | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      pinterest_category_boards: {
        Row: {
          board_id: string
          board_name: string
          category_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          board_id: string
          board_name: string
          category_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          board_id?: string
          board_name?: string
          category_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinterest_category_boards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pinterest_config: {
        Row: {
          access_token: string | null
          app_id: string | null
          app_secret: string | null
          boards_cache: Json | null
          created_at: string
          default_board_id: string | null
          delay_minutes: number
          id: string
          is_enabled: boolean
          max_pins_per_product: number
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          app_id?: string | null
          app_secret?: string | null
          boards_cache?: Json | null
          created_at?: string
          default_board_id?: string | null
          delay_minutes?: number
          id?: string
          is_enabled?: boolean
          max_pins_per_product?: number
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          app_id?: string | null
          app_secret?: string | null
          boards_cache?: Json | null
          created_at?: string
          default_board_id?: string | null
          delay_minutes?: number
          id?: string
          is_enabled?: boolean
          max_pins_per_product?: number
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pinterest_pins_log: {
        Row: {
          board_id: string | null
          created_at: string
          description: string | null
          error_message: string | null
          id: string
          image_url: string | null
          pin_id: string | null
          pin_url: string | null
          product_id: string | null
          status: string
          title: string | null
        }
        Insert: {
          board_id?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          pin_id?: string | null
          pin_url?: string | null
          product_id?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          board_id?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          pin_id?: string | null
          pin_url?: string | null
          product_id?: string | null
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pinterest_pins_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          deactivated_at: string | null
          email: string | null
          first_login_completed: boolean | null
          id: string
          indicador_id: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          onboarding_completed: boolean | null
          onboarding_progress: Json | null
          phone: string | null
          ref_key: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          email?: string | null
          first_login_completed?: boolean | null
          id: string
          indicador_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_progress?: Json | null
          phone?: string | null
          ref_key?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          email?: string | null
          first_login_completed?: boolean | null
          id?: string
          indicador_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_progress?: Json | null
          phone?: string | null
          ref_key?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_campaign_views: {
        Row: {
          campaign_id: string
          converted: boolean
          created_at: string
          dismissed: boolean
          id: string
          last_shown_at: string | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          campaign_id: string
          converted?: boolean
          created_at?: string
          dismissed?: boolean
          id?: string
          last_shown_at?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          campaign_id?: string
          converted?: boolean
          created_at?: string
          dismissed?: boolean
          id?: string
          last_shown_at?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotional_campaign_views_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_campaigns: {
        Row: {
          base_plan_id: string
          benefit_text: string | null
          created_at: string
          cta_text: string
          description: string
          ends_at: string
          headline: string
          id: string
          is_active: boolean
          max_displays_per_user: number
          original_price: number
          promo_period_days: number
          promo_period_label: string
          promo_price: number
          starts_at: string
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          base_plan_id: string
          benefit_text?: string | null
          created_at?: string
          cta_text?: string
          description: string
          ends_at: string
          headline: string
          id?: string
          is_active?: boolean
          max_displays_per_user?: number
          original_price: number
          promo_period_days: number
          promo_period_label: string
          promo_price: number
          starts_at?: string
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          base_plan_id?: string
          benefit_text?: string | null
          created_at?: string
          cta_text?: string
          description?: string
          ends_at?: string
          headline?: string
          id?: string
          is_active?: boolean
          max_displays_per_user?: number
          original_price?: number
          promo_period_days?: number
          promo_period_label?: string
          promo_price?: number
          starts_at?: string
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ranking_alerts: {
        Row: {
          alert_type: string
          article_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          keyword: string
          message: string | null
          new_position: number | null
          old_position: number | null
        }
        Insert: {
          alert_type: string
          article_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          keyword: string
          message?: string | null
          new_position?: number | null
          old_position?: number | null
        }
        Update: {
          alert_type?: string
          article_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          keyword?: string
          message?: string | null
          new_position?: number | null
          old_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_alerts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_tracking: {
        Row: {
          article_id: string
          checked_at: string | null
          device: string | null
          id: string
          keyword: string
          position: number | null
          position_change: number | null
          previous_position: number | null
          url: string | null
        }
        Insert: {
          article_id: string
          checked_at?: string | null
          device?: string | null
          id?: string
          keyword: string
          position?: number | null
          position_change?: number | null
          previous_position?: number | null
          url?: string | null
        }
        Update: {
          article_id?: string
          checked_at?: string | null
          device?: string | null
          id?: string
          keyword?: string
          position?: number | null
          position_change?: number | null
          previous_position?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_tracking_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          action: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          id: string
          identifier: string
        }
        Insert: {
          action: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier: string
        }
        Update: {
          action?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      receipt_format_settings: {
        Row: {
          address_font_size: string
          container_width: string
          created_at: string
          customer_font_size: string
          datetime_font_size: string
          final_total_font_size: string
          font_family: string
          format: string
          id: string
          logo_max_height: string
          logo_max_width: string
          margins: string
          padding: string
          phone_font_size: string
          quote_font_size: string
          table_font_size: string
          title_font_size: string
          totals_font_size: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_font_size?: string
          container_width?: string
          created_at?: string
          customer_font_size?: string
          datetime_font_size?: string
          final_total_font_size?: string
          font_family?: string
          format: string
          id?: string
          logo_max_height?: string
          logo_max_width?: string
          margins?: string
          padding?: string
          phone_font_size?: string
          quote_font_size?: string
          table_font_size?: string
          title_font_size?: string
          totals_font_size?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_font_size?: string
          container_width?: string
          created_at?: string
          customer_font_size?: string
          datetime_font_size?: string
          final_total_font_size?: string
          font_family?: string
          format?: string
          id?: string
          logo_max_height?: string
          logo_max_width?: string
          margins?: string
          padding?: string
          phone_font_size?: string
          quote_font_size?: string
          table_font_size?: string
          title_font_size?: string
          totals_font_size?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recompensas_indicacao: {
        Row: {
          created_at: string
          data_credito: string
          dias_creditados: number
          id: string
          indicado_id: string
          numero_renovacao: number | null
          plano_ativado: string
          tipo_bonus: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_credito?: string
          dias_creditados: number
          id?: string
          indicado_id: string
          numero_renovacao?: number | null
          plano_ativado: string
          tipo_bonus?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_credito?: string
          dias_creditados?: number
          id?: string
          indicado_id?: string
          numero_renovacao?: number | null
          plano_ativado?: string
          tipo_bonus?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recompensas_indicacao_indicado_id_fkey"
            columns: ["indicado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompensas_indicacao_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_settings: {
        Row: {
          bonus_days: number
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          plan_label: string
          plan_type: string
          renewal_percentage: number
          updated_at: string | null
        }
        Insert: {
          bonus_days?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          plan_label?: string
          plan_type: string
          renewal_percentage?: number
          updated_at?: string | null
        }
        Update: {
          bonus_days?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          plan_label?: string
          plan_type?: string
          renewal_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      role_default_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      scale_profiles: {
        Row: {
          brand: string
          created_at: string
          created_by: string | null
          data_bits: number
          default_baud_rate: number
          default_tcp_port: number | null
          frame_regex: string
          id: string
          is_active: boolean
          model: string
          notes: string | null
          parity: string
          protocol: string
          request_byte: number | null
          stable_flag_byte: number | null
          stop_bits: number
          transport: string
          updated_at: string
          weight_divisor: number
        }
        Insert: {
          brand: string
          created_at?: string
          created_by?: string | null
          data_bits?: number
          default_baud_rate?: number
          default_tcp_port?: number | null
          frame_regex: string
          id?: string
          is_active?: boolean
          model: string
          notes?: string | null
          parity?: string
          protocol: string
          request_byte?: number | null
          stable_flag_byte?: number | null
          stop_bits?: number
          transport?: string
          updated_at?: string
          weight_divisor?: number
        }
        Update: {
          brand?: string
          created_at?: string
          created_by?: string | null
          data_bits?: number
          default_baud_rate?: number
          default_tcp_port?: number | null
          frame_regex?: string
          id?: string
          is_active?: boolean
          model?: string
          notes?: string | null
          parity?: string
          protocol?: string
          request_byte?: number | null
          stable_flag_byte?: number | null
          stop_bits?: number
          transport?: string
          updated_at?: string
          weight_divisor?: number
        }
        Relationships: []
      }
      scale_test_logs: {
        Row: {
          config_id: string | null
          error_message: string | null
          id: string
          parsed_weight: number | null
          raw_data: string | null
          success: boolean
          tested_at: string
          user_id: string
        }
        Insert: {
          config_id?: string | null
          error_message?: string | null
          id?: string
          parsed_weight?: number | null
          raw_data?: string | null
          success?: boolean
          tested_at?: string
          user_id: string
        }
        Update: {
          config_id?: string | null
          error_message?: string | null
          id?: string
          parsed_weight?: number | null
          raw_data?: string | null
          success?: boolean
          tested_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scale_test_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "user_scale_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      scaled_articles: {
        Row: {
          created_at: string | null
          error_message: string | null
          generated_article_id: string | null
          id: string
          source_article_id: string | null
          source_keyword: string | null
          status: string | null
          variation_keyword: string | null
          variation_type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          generated_article_id?: string | null
          id?: string
          source_article_id?: string | null
          source_keyword?: string | null
          status?: string | null
          variation_keyword?: string | null
          variation_type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          generated_article_id?: string | null
          id?: string
          source_article_id?: string | null
          source_keyword?: string | null
          status?: string | null
          variation_keyword?: string | null
          variation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scaled_articles_generated_article_id_fkey"
            columns: ["generated_article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scaled_articles_source_article_id_fkey"
            columns: ["source_article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      security_blocks: {
        Row: {
          attempt_count: number | null
          auto_blocked: boolean | null
          block_type: Database["public"]["Enums"]["block_type"]
          blocked_until: string | null
          created_at: string | null
          created_by: string | null
          id: string
          identifier: string
          is_permanent: boolean | null
          reason: string
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          auto_blocked?: boolean | null
          block_type: Database["public"]["Enums"]["block_type"]
          blocked_until?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          identifier: string
          is_permanent?: boolean | null
          reason: string
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          auto_blocked?: boolean | null
          block_type?: Database["public"]["Enums"]["block_type"]
          blocked_until?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          identifier?: string
          is_permanent?: boolean | null
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_configurations: {
        Row: {
          bing_verification: string | null
          breadcrumbs_enabled: boolean | null
          canonical_url: string | null
          created_at: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          google_search_console_verification: string | null
          google_tag_manager_id: string | null
          hreflang: Json | null
          id: string
          image_optimization_enabled: boolean | null
          lazy_loading_enabled: boolean | null
          noindex_pages: string[] | null
          og_description: string | null
          og_image: string | null
          og_site_name: string | null
          og_title: string | null
          og_type: string | null
          og_url: string | null
          priority_pages: Json | null
          robots_txt: string | null
          schema_org: Json | null
          site_author: string
          site_description: string
          site_keywords: string
          site_title: string
          sitemap_enabled: boolean | null
          twitter_card: string | null
          twitter_creator: string | null
          twitter_description: string | null
          twitter_image: string | null
          twitter_site: string | null
          twitter_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bing_verification?: string | null
          breadcrumbs_enabled?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_search_console_verification?: string | null
          google_tag_manager_id?: string | null
          hreflang?: Json | null
          id?: string
          image_optimization_enabled?: boolean | null
          lazy_loading_enabled?: boolean | null
          noindex_pages?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          og_type?: string | null
          og_url?: string | null
          priority_pages?: Json | null
          robots_txt?: string | null
          schema_org?: Json | null
          site_author?: string
          site_description?: string
          site_keywords?: string
          site_title?: string
          sitemap_enabled?: boolean | null
          twitter_card?: string | null
          twitter_creator?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_site?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bing_verification?: string | null
          breadcrumbs_enabled?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_search_console_verification?: string | null
          google_tag_manager_id?: string | null
          hreflang?: Json | null
          id?: string
          image_optimization_enabled?: boolean | null
          lazy_loading_enabled?: boolean | null
          noindex_pages?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          og_type?: string | null
          og_url?: string | null
          priority_pages?: Json | null
          robots_txt?: string | null
          schema_org?: Json | null
          site_author?: string
          site_description?: string
          site_keywords?: string
          site_title?: string
          sitemap_enabled?: boolean | null
          twitter_card?: string | null
          twitter_creator?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_site?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seo_optimization_scores: {
        Row: {
          article_id: string
          best_keyword: string | null
          best_position: number | null
          content_score: number | null
          created_at: string | null
          cta_score: number | null
          days_since_update: number | null
          freshness_score: number | null
          has_ctas: boolean | null
          id: string
          interlinking_score: number | null
          internal_links_count: number | null
          last_analyzed: string | null
          last_optimized: string | null
          opportunity_score: number | null
          position_trend: string | null
          priority: string | null
          ranking_score: number | null
          suggestions: Json | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          article_id: string
          best_keyword?: string | null
          best_position?: number | null
          content_score?: number | null
          created_at?: string | null
          cta_score?: number | null
          days_since_update?: number | null
          freshness_score?: number | null
          has_ctas?: boolean | null
          id?: string
          interlinking_score?: number | null
          internal_links_count?: number | null
          last_analyzed?: string | null
          last_optimized?: string | null
          opportunity_score?: number | null
          position_trend?: string | null
          priority?: string | null
          ranking_score?: number | null
          suggestions?: Json | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          article_id?: string
          best_keyword?: string | null
          best_position?: number | null
          content_score?: number | null
          created_at?: string | null
          cta_score?: number | null
          days_since_update?: number | null
          freshness_score?: number | null
          has_ctas?: boolean | null
          id?: string
          interlinking_score?: number | null
          internal_links_count?: number | null
          last_analyzed?: string | null
          last_optimized?: string | null
          opportunity_score?: number | null
          position_trend?: string | null
          priority?: string | null
          ranking_score?: number | null
          suggestions?: Json | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_optimization_scores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_optimizer_config: {
        Row: {
          articles_per_day: number
          articles_today: number
          created_at: string
          enabled: boolean
          hours_interval: number
          id: string
          last_article_id: string | null
          last_run_at: string | null
          min_score: number
          reset_date: string
          updated_at: string
        }
        Insert: {
          articles_per_day?: number
          articles_today?: number
          created_at?: string
          enabled?: boolean
          hours_interval?: number
          id?: string
          last_article_id?: string | null
          last_run_at?: string | null
          min_score?: number
          reset_date?: string
          updated_at?: string
        }
        Update: {
          articles_per_day?: number
          articles_today?: number
          created_at?: string
          enabled?: boolean
          hours_interval?: number
          id?: string
          last_article_id?: string | null
          last_run_at?: string | null
          min_score?: number
          reset_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_topic_bank: {
        Row: {
          category: string
          created_at: string
          id: string
          is_used: boolean
          keywords: string[]
          priority: number
          scheduled_for: string | null
          topic: string
          used_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_used?: boolean
          keywords?: string[]
          priority?: number
          scheduled_for?: string | null
          topic: string
          used_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_used?: boolean
          keywords?: string[]
          priority?: number
          scheduled_for?: string | null
          topic?: string
          used_at?: string | null
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_components: {
        Row: {
          component_type: string
          container_id: string | null
          content: Json | null
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          updated_at: string | null
        }
        Insert: {
          component_type: string
          container_id?: string | null
          content?: Json | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Update: {
          component_type?: string
          container_id?: string | null
          content?: Json | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_components_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "shop_containers"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      shop_containers: {
        Row: {
          container_type: string
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          page_id: string | null
          settings: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          container_type: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          page_id?: string | null
          settings?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          container_type?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          page_id?: string | null
          settings?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_containers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "shop_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_interactive_config: {
        Row: {
          created_at: string
          current_value_label: string
          default_duration_minutes: number
          default_increment: number
          enable_animations: boolean
          enable_sounds: boolean
          event_title_label: string
          id: string
          is_enabled: boolean
          participate_button_text: string
          time_remaining_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value_label?: string
          default_duration_minutes?: number
          default_increment?: number
          enable_animations?: boolean
          enable_sounds?: boolean
          event_title_label?: string
          id?: string
          is_enabled?: boolean
          participate_button_text?: string
          time_remaining_label?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value_label?: string
          default_duration_minutes?: number
          default_increment?: number
          enable_animations?: boolean
          enable_sounds?: boolean
          event_title_label?: string
          id?: string
          is_enabled?: boolean
          participate_button_text?: string
          time_remaining_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_interactive_events: {
        Row: {
          auto_repost_count: number | null
          auto_repost_delay_days: number | null
          created_at: string
          current_repost_number: number | null
          current_value: number
          end_at: string
          final_order_id: string | null
          id: string
          initial_value: number
          minimum_increment: number
          product_id: string
          reactivate_at: string | null
          reactivation_initial_value: number | null
          start_at: string
          status: Database["public"]["Enums"]["interactive_event_status"]
          updated_at: string
          winner_user_id: string | null
          winning_offer_id: string | null
        }
        Insert: {
          auto_repost_count?: number | null
          auto_repost_delay_days?: number | null
          created_at?: string
          current_repost_number?: number | null
          current_value: number
          end_at: string
          final_order_id?: string | null
          id?: string
          initial_value: number
          minimum_increment?: number
          product_id: string
          reactivate_at?: string | null
          reactivation_initial_value?: number | null
          start_at: string
          status?: Database["public"]["Enums"]["interactive_event_status"]
          updated_at?: string
          winner_user_id?: string | null
          winning_offer_id?: string | null
        }
        Update: {
          auto_repost_count?: number | null
          auto_repost_delay_days?: number | null
          created_at?: string
          current_repost_number?: number | null
          current_value?: number
          end_at?: string
          final_order_id?: string | null
          id?: string
          initial_value?: number
          minimum_increment?: number
          product_id?: string
          reactivate_at?: string | null
          reactivation_initial_value?: number | null
          start_at?: string
          status?: Database["public"]["Enums"]["interactive_event_status"]
          updated_at?: string
          winner_user_id?: string | null
          winning_offer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_winning_offer"
            columns: ["winning_offer_id"]
            isOneToOne: false
            referencedRelation: "shop_interactive_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_interactive_events_final_order_id_fkey"
            columns: ["final_order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_interactive_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_interactive_events_winner_user_id_fkey"
            columns: ["winner_user_id"]
            isOneToOne: false
            referencedRelation: "shop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_interactive_offers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_valid: boolean
          is_winning: boolean
          offer_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_valid?: boolean
          is_winning?: boolean
          offer_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_valid?: boolean
          is_winning?: boolean
          offer_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_interactive_offers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "shop_interactive_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_interactive_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          customer_document: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount: number | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_id: string | null
          payment_method: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shop_user_id: string | null
          status: string | null
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          customer_document?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          items: Json
          notes?: string | null
          order_number: string
          payment_id?: string | null
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shop_user_id?: string | null
          status?: string | null
          subtotal: number
          total: number
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          customer_document?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_id?: string | null
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shop_user_id?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_shop_user_id_fkey"
            columns: ["shop_user_id"]
            isOneToOne: false
            referencedRelation: "shop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_pages: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_homepage: boolean | null
          meta_description: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_homepage?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_homepage?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_verified: boolean
          is_visible: boolean
          order_id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          is_visible?: boolean
          order_id: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          is_visible?: boolean
          order_id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          allow_indexing: boolean
          canonical_url: string | null
          category_id: string | null
          condition: string | null
          cost_price: number | null
          created_at: string | null
          delivery_type: string | null
          description: string | null
          description_about: string | null
          description_condition: string | null
          description_highlights: Json | null
          dimensions: Json | null
          final_cost: number | null
          id: string
          images: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          is_visible: boolean
          marketplace_data: Json | null
          name: string
          og_image: string | null
          price: number
          sale_price: number | null
          sale_type: string
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sitemap_changefreq: string | null
          sitemap_priority: number | null
          sku: string | null
          slug: string
          sold_count: number
          specs: Json | null
          stock_quantity: number | null
          tags: string[] | null
          updated_at: string | null
          view_count: number
          weight: number | null
        }
        Insert: {
          allow_indexing?: boolean
          canonical_url?: string | null
          category_id?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          delivery_type?: string | null
          description?: string | null
          description_about?: string | null
          description_condition?: string | null
          description_highlights?: Json | null
          dimensions?: Json | null
          final_cost?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_visible?: boolean
          marketplace_data?: Json | null
          name: string
          og_image?: string | null
          price: number
          sale_price?: number | null
          sale_type?: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          sku?: string | null
          slug: string
          sold_count?: number
          specs?: Json | null
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number
          weight?: number | null
        }
        Update: {
          allow_indexing?: boolean
          canonical_url?: string | null
          category_id?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          delivery_type?: string | null
          description?: string | null
          description_about?: string | null
          description_condition?: string | null
          description_highlights?: Json | null
          dimensions?: Json | null
          final_cost?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_visible?: boolean
          marketplace_data?: Json | null
          name?: string
          og_image?: string | null
          price?: number
          sale_price?: number | null
          sale_type?: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          sku?: string | null
          slug?: string
          sold_count?: number
          specs?: Json | null
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_seo_ping_log: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          response_message: string | null
          search_engine: string
          status: string
          status_code: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          response_message?: string | null
          search_engine: string
          status: string
          status_code?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          response_message?: string | null
          search_engine?: string
          status?: string
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_seo_ping_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_seo_settings: {
        Row: {
          auto_ping_enabled: boolean
          base_url: string
          created_at: string
          default_changefreq: string
          default_og_image: string | null
          default_priority: number
          id: string
          indexnow_key: string | null
          last_ping_at: string | null
          last_sitemap_generated_at: string | null
          updated_at: string
        }
        Insert: {
          auto_ping_enabled?: boolean
          base_url?: string
          created_at?: string
          default_changefreq?: string
          default_og_image?: string | null
          default_priority?: number
          id?: string
          indexnow_key?: string | null
          last_ping_at?: string | null
          last_sitemap_generated_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_ping_enabled?: boolean
          base_url?: string
          created_at?: string
          default_changefreq?: string
          default_og_image?: string | null
          default_priority?: number
          id?: string
          indexnow_key?: string | null
          last_ping_at?: string | null
          last_sitemap_generated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_user_addresses: {
        Row: {
          city: string
          complement: string | null
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          neighborhood: string
          number: string
          phone: string | null
          recipient_name: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood: string
          number: string
          phone?: string | null
          recipient_name: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string
          number?: string
          phone?: string | null
          recipient_name?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_user_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_user_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_users: {
        Row: {
          created_at: string
          email: string
          email_verified: boolean
          id: string
          last_login_at: string | null
          name: string
          password_hash: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          name: string
          password_hash: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          name?: string
          password_hash?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      static_pages_seo: {
        Row: {
          allow_indexing: boolean | null
          canonical_url: string | null
          created_at: string | null
          id: string
          include_in_sitemap: boolean | null
          is_protected: boolean | null
          og_image: string | null
          page_name: string
          path: string
          seo_description: string | null
          seo_title: string | null
          sitemap_changefreq: string | null
          sitemap_priority: number | null
          updated_at: string | null
        }
        Insert: {
          allow_indexing?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          id?: string
          include_in_sitemap?: boolean | null
          is_protected?: boolean | null
          og_image?: string | null
          page_name: string
          path: string
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_indexing?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          id?: string
          include_in_sitemap?: boolean | null
          is_protected?: boolean | null
          og_image?: string | null
          page_name?: string
          path?: string
          seo_description?: string | null
          seo_title?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          amount: number
          badge_text: string | null
          created_at: string
          description: string
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          is_promotional: boolean | null
          name: string
          period: string
          period_days: number | null
          plan_id: string
          plan_type: string
          price: number
          promotional_description: string | null
          promotional_period: string | null
          promotional_price: number | null
          savings: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          amount: number
          badge_text?: string | null
          created_at?: string
          description: string
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_promotional?: boolean | null
          name: string
          period: string
          period_days?: number | null
          plan_id: string
          plan_type?: string
          price: number
          promotional_description?: string | null
          promotional_period?: string | null
          promotional_price?: number | null
          savings?: string | null
          tier?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          badge_text?: string | null
          created_at?: string
          description?: string
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_promotional?: boolean | null
          name?: string
          period?: string
          period_days?: number | null
          plan_id?: string
          plan_type?: string
          price?: number
          promotional_description?: string | null
          promotional_period?: string | null
          promotional_price?: number | null
          savings?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activated_at: string | null
          activation_method: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          period_days: number | null
          plan_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activation_method?: string | null
          created_at?: string | null
          expires_at?: string | null
          id: string
          is_active?: boolean | null
          period_days?: number | null
          plan_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activation_method?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          period_days?: number | null
          plan_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          id: string
          logo: string | null
          seo_config: Json | null
          updated_at: string
          user_id: string
          whatsapp1: string | null
          whatsapp2: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          seo_config?: Json | null
          updated_at?: string
          user_id: string
          whatsapp1?: string | null
          whatsapp2?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          seo_config?: Json | null
          updated_at?: string
          user_id?: string
          whatsapp1?: string | null
          whatsapp2?: string | null
        }
        Relationships: []
      }
      telegram_bot_config: {
        Row: {
          allowed_chat_ids: number[] | null
          bot_token: string
          created_at: string | null
          default_category_id: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          allowed_chat_ids?: number[] | null
          bot_token: string
          created_at?: string | null
          default_category_id?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          allowed_chat_ids?: number[] | null
          bot_token?: string
          created_at?: string | null
          default_category_id?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_bot_config_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_product_buffer: {
        Row: {
          ai_metadata: Json | null
          chat_id: number
          created_at: string | null
          draft_product_id: string | null
          expires_at: string | null
          id: string
          messages: Json | null
          photo_file_ids: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_metadata?: Json | null
          chat_id: number
          created_at?: string | null
          draft_product_id?: string | null
          expires_at?: string | null
          id?: string
          messages?: Json | null
          photo_file_ids?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_metadata?: Json | null
          chat_id?: number
          created_at?: string | null
          draft_product_id?: string | null
          expires_at?: string | null
          id?: string
          messages?: Json | null
          photo_file_ids?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_product_buffer_draft_product_id_fkey"
            columns: ["draft_product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_product_pending: {
        Row: {
          ai_parsed_data: Json | null
          chat_id: number
          created_at: string | null
          expires_at: string | null
          id: string
          media_group_id: string
          photos: Json | null
          preview_message_id: number | null
          product_id: string | null
          raw_user_text: string | null
          status: string | null
          temp_image_urls: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_parsed_data?: Json | null
          chat_id: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_group_id: string
          photos?: Json | null
          preview_message_id?: number | null
          product_id?: string | null
          raw_user_text?: string | null
          status?: string | null
          temp_image_urls?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_parsed_data?: Json | null
          chat_id?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_group_id?: string
          photos?: Json | null
          preview_message_id?: number | null
          product_id?: string | null
          raw_user_text?: string | null
          status?: string | null
          temp_image_urls?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_product_pending_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_wizard_sessions: {
        Row: {
          chat_id: number
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          sale_type: string | null
          step: string
          updated_at: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          sale_type?: string | null
          step?: string
          updated_at?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          sale_type?: string | null
          step?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tier_features: {
        Row: {
          created_at: string
          feature_key: string
          feature_label: string
          id: string
          is_enabled: boolean
          tier_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          feature_label: string
          id?: string
          is_enabled?: boolean
          tier_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          feature_label?: string
          id?: string
          is_enabled?: boolean
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_features_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      unidade_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity: string
          session_token: string
          unidade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          session_token: string
          unidade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          session_token?: string
          unidade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidade_sessions_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          id: string
          nome_completo: string
          plano_ativo: boolean | null
          senha_hash: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          nome_completo: string
          plano_ativo?: boolean | null
          senha_hash: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          nome_completo?: string
          plano_ativo?: boolean | null
          senha_hash?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_attribution: {
        Row: {
          created_at: string | null
          first_page: string | null
          id: string
          referrer: string | null
          source_article_id: string | null
          source_url: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string | null
          first_page?: string | null
          id?: string
          referrer?: string | null
          source_article_id?: string | null
          source_url?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string | null
          first_page?: string | null
          id?: string
          referrer?: string | null
          source_article_id?: string | null
          source_url?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_attribution_source_article_id_fkey"
            columns: ["source_article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          consent_version: string
          consented_at: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          revoked_at: string | null
          revoked_reason: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          consent_version: string
          consented_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          revoked_reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          consent_version?: string
          consented_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          revoked_reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_direct_messages: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          sender_name?: string
          title?: string
        }
        Relationships: []
      }
      user_lifecycle: {
        Row: {
          churn_reason: string | null
          created_at: string | null
          current_stage: string | null
          id: string
          last_active_at: string | null
          metadata: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          stage_changed_at: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          churn_reason?: string | null
          created_at?: string | null
          current_stage?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          stage_changed_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          churn_reason?: string | null
          created_at?: string | null
          current_stage?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          stage_changed_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_material_settings: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          use_categories: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          use_categories?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          use_categories?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          sender_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_seen_at: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_scale_configs: {
        Row: {
          auto_connect: boolean
          baud_rate: number
          created_at: string
          data_bits: number
          decimal_places: number
          frame_regex: string
          id: string
          is_default: boolean
          last_test_at: string | null
          last_test_status: string | null
          last_test_weight: number | null
          nickname: string
          parity: string
          pdv_input_mode: string
          profile_id: string | null
          qz_port_name: string | null
          request_byte: number | null
          stop_bits: number
          tcp_host: string | null
          tcp_port: number | null
          transport: string
          unit: string
          updated_at: string
          user_id: string
          weight_divisor: number
        }
        Insert: {
          auto_connect?: boolean
          baud_rate?: number
          created_at?: string
          data_bits?: number
          decimal_places?: number
          frame_regex: string
          id?: string
          is_default?: boolean
          last_test_at?: string | null
          last_test_status?: string | null
          last_test_weight?: number | null
          nickname: string
          parity?: string
          pdv_input_mode?: string
          profile_id?: string | null
          qz_port_name?: string | null
          request_byte?: number | null
          stop_bits?: number
          tcp_host?: string | null
          tcp_port?: number | null
          transport?: string
          unit?: string
          updated_at?: string
          user_id: string
          weight_divisor?: number
        }
        Update: {
          auto_connect?: boolean
          baud_rate?: number
          created_at?: string
          data_bits?: number
          decimal_places?: number
          frame_regex?: string
          id?: string
          is_default?: boolean
          last_test_at?: string | null
          last_test_status?: string | null
          last_test_weight?: number | null
          nickname?: string
          parity?: string
          pdv_input_mode?: string
          profile_id?: string | null
          qz_port_name?: string | null
          request_byte?: number | null
          stop_bits?: number
          tcp_host?: string | null
          tcp_port?: number | null
          transport?: string
          unit?: string
          updated_at?: string
          user_id?: string
          weight_divisor?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_scale_configs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "scale_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          activated_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          payment_method: string | null
          payment_reference: string | null
          plan_type: string
          tier: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_type?: string
          tier?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_type?: string
          tier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_video_progress: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          user_id: string
          video_id: string
          watched_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id: string
          video_id: string
          watched_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id?: string
          video_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "guide_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_profiles: {
        Row: {
          city: string | null
          created_at: string | null
          cta_clicks: number | null
          device: string | null
          entry_keyword: string | null
          entry_page: string | null
          id: string
          pages_viewed: number | null
          profile_type: string | null
          referrer: string | null
          session_id: string
          source: string | null
          time_on_site: number | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          cta_clicks?: number | null
          device?: string | null
          entry_keyword?: string | null
          entry_page?: string | null
          id?: string
          pages_viewed?: number | null
          profile_type?: string | null
          referrer?: string | null
          session_id: string
          source?: string | null
          time_on_site?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          cta_clicks?: number | null
          device?: string | null
          entry_keyword?: string | null
          entry_page?: string | null
          id?: string
          pages_viewed?: number | null
          profile_type?: string | null
          referrer?: string | null
          session_id?: string
          source?: string | null
          time_on_site?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      shop_product_rating_stats: {
        Row: {
          average_rating: number | null
          five_star: number | null
          four_star: number | null
          one_star: number | null
          product_id: string | null
          review_count: number | null
          three_star: number | null
          two_star: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_scheduled_event: { Args: { p_event_id: string }; Returns: Json }
      activate_unidade_session: {
        Args: {
          device_info_input?: string
          ip_address_input?: unknown
          session_token_input: string
          unidade_uuid: string
        }
        Returns: boolean
      }
      append_photo_to_wizard: {
        Args: { p_chat_id: number; p_file_id: string }
        Returns: {
          chat_id: number
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          sale_type: string | null
          step: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "telegram_wizard_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      append_to_telegram_buffer: {
        Args: {
          p_chat_id: number
          p_message_text?: string
          p_photo_file_id?: string
        }
        Returns: string
      }
      calcular_bonus_indicacao: {
        Args: { p_is_renewal?: boolean; p_plan_type: string }
        Returns: number
      }
      check_employee_work_hours: {
        Args: { p_employee_user_id: string }
        Returns: Json
      }
      check_password_breach: {
        Args: { password_hash: string }
        Returns: boolean
      }
      check_pdv_access: { Args: { p_owner_user_id: string }; Returns: Json }
      check_rate_limit: {
        Args: {
          p_action: string
          p_block_minutes?: number
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      check_user_feature: {
        Args: { p_feature_key: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      cleanup_expired_telegram_buffers: { Args: never; Returns: number }
      cleanup_expired_telegram_pending: { Args: never; Returns: number }
      cleanup_expired_wizard_sessions: { Args: never; Returns: number }
      cleanup_inactive_unidade_sessions: { Args: never; Returns: undefined }
      cleanup_old_presence: { Args: never; Returns: undefined }
      cleanup_system_data:
        | {
            Args: {
              p_batch_size?: number
              p_max_batches?: number
              p_retention_days?: number
              p_section: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_batch_size?: number
              p_retention_days?: number
              p_section: string
            }
            Returns: Json
          }
      cleanup_system_table:
        | {
            Args: {
              p_batch_size?: number
              p_max_batches?: number
              p_retention_days?: number
              p_table: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_batch_size?: number
              p_retention_days?: number
              p_table: string
            }
            Returns: Json
          }
      clear_telegram_buffer: { Args: { p_chat_id: number }; Returns: boolean }
      create_default_categories_and_materials: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_interactive_offer: {
        Args: { p_event_id: string; p_offer_value: number; p_user_id: string }
        Returns: Json
      }
      deactivate_unidade_session: {
        Args: { unidade_uuid: string }
        Returns: undefined
      }
      finalize_interactive_event: {
        Args: { p_event_id: string }
        Returns: Json
      }
      force_takeover_pdv_session: { Args: never; Returns: Json }
      generate_ref_key: { Args: { user_name: string }; Returns: string }
      get_admin_access_level: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_dashboard_summary: {
        Args: {
          filter_end?: string
          filter_start?: string
          target_user_id: string
        }
        Returns: Json
      }
      get_database_statistics: { Args: never; Returns: Json }
      get_depot_clients_totals: {
        Args: never
        Returns: {
          depot_client_id: string
          real_orders: number
          total_compras: number
          total_vendas: number
        }[]
      }
      get_effective_user_id: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_function_count: { Args: never; Returns: Json }
      get_online_users: {
        Args: never
        Returns: {
          last_seen_at: string
          session_id: string
          user_id: string
        }[]
      }
      get_or_create_wizard_session: {
        Args: { p_chat_id: number }
        Returns: {
          chat_id: number
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          sale_type: string | null
          step: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "telegram_wizard_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_referral_stats: { Args: { p_user_id: string }; Returns: Json }
      get_storage_usage: { Args: never; Returns: Json }
      get_system_cleanup_metrics: {
        Args: { p_retention_days?: number }
        Returns: Json
      }
      get_system_stats: { Args: never; Returns: Json }
      get_table_count: { Args: never; Returns: Json }
      get_table_sizes: { Args: never; Returns: Json }
      get_telegram_buffer: {
        Args: { p_chat_id: number }
        Returns: {
          chat_id: number
          created_at: string
          draft_product_id: string
          id: string
          messages: Json
          photo_file_ids: Json
          status: string
          updated_at: string
        }[]
      }
      get_unread_admin_messages: {
        Args: never
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_direct_messages: {
        Args: never
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_error_reports: {
        Args: never
        Returns: {
          created_at: string
          error_description: string
          error_title: string
          error_type: string
          id: string
          user_email: string
        }[]
      }
      get_unread_global_notifications: {
        Args: never
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_realtime_messages: {
        Args: never
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_user_active_cash_register: {
        Args: { target_user_id: string }
        Returns: {
          closing_timestamp: string | null
          created_at: string | null
          current_amount: number
          final_amount: number | null
          gross_profit: number | null
          id: string
          initial_amount: number
          net_profit: number | null
          opening_timestamp: string | null
          status: string | null
          unidade_id: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "cash_registers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_cash_registers: {
        Args: { target_user_id: string }
        Returns: {
          closing_timestamp: string | null
          created_at: string | null
          current_amount: number
          final_amount: number | null
          gross_profit: number | null
          id: string
          initial_amount: number
          net_profit: number | null
          opening_timestamp: string | null
          status: string | null
          unidade_id: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "cash_registers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_features: {
        Args: { p_user_id?: string }
        Returns: {
          feature_key: string
          feature_label: string
        }[]
      }
      get_user_materials: {
        Args: { target_user_id: string }
        Returns: {
          category_id: string | null
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          previous_price: number | null
          previous_sale_price: number | null
          price: number
          sale_price: number
          unidade_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "materials"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_orders: { Args: { target_user_id: string }; Returns: Json }
      get_user_referrals: {
        Args: { user_uuid: string }
        Returns: {
          data_recompensa: string
          dias_recompensa: number
          indicado_email: string
          indicado_id: string
          indicado_name: string
          is_active: boolean
          plan_type: string
        }[]
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_status"]
      }
      get_user_roles: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_user_status: {
        Args: never
        Returns: Database["public"]["Enums"]["user_status"]
      }
      get_user_tier: { Args: { p_user_id?: string }; Returns: string }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      heartbeat_pdv_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      increment_view_count: {
        Args: { record_id: string; table_name: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_master: { Args: { _user_id?: string }; Returns: boolean }
      is_blocked: {
        Args: {
          p_block_type: Database["public"]["Enums"]["block_type"]
          p_identifier: string
        }
        Returns: boolean
      }
      is_employee: { Args: { target_user_id: string }; Returns: boolean }
      is_feature_enabled: {
        Args: { p_feature_name: string; p_user_id?: string }
        Returns: boolean
      }
      is_subscription_active: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_unidade_available: { Args: { unidade_uuid: string }; Returns: boolean }
      lock_ready_telegram_groups: {
        Args: never
        Returns: {
          ai_parsed_data: Json | null
          chat_id: number
          created_at: string | null
          expires_at: string | null
          id: string
          media_group_id: string
          photos: Json | null
          preview_message_id: number | null
          product_id: string | null
          raw_user_text: string | null
          status: string | null
          temp_image_urls: Json | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "telegram_product_pending"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_access: {
        Args: {
          p_action: string
          p_error_message?: string
          p_metadata?: Json
          p_success?: boolean
        }
        Returns: string
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_description?: string
          p_new_value?: Json
          p_old_value?: Json
          p_target_record_id?: string
          p_target_table?: string
          p_target_user_id?: string
        }
        Returns: string
      }
      reactivate_cooled_down_products: {
        Args: never
        Returns: {
          event_id: string
          new_event_id: string
          product_id: string
        }[]
      }
      regenerate_all_ref_keys: { Args: never; Returns: number }
      register_pdv_session:
        | {
            Args: {
              p_device_info?: string
              p_owner_user_id: string
              p_session_token: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_device_id?: string
              p_device_info?: string
              p_owner_user_id: string
              p_session_token: string
            }
            Returns: Json
          }
      release_pdv_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      sanitize_input: { Args: { input_text: string }; Returns: string }
      sanitize_text_input: { Args: { input_text: string }; Returns: string }
      schedule_presence_cleanup: { Args: never; Returns: undefined }
      seed_default_categories_for_current_user: {
        Args: never
        Returns: undefined
      }
      shop_confirm_order_stock: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      shop_create_order_pending: {
        Args: {
          p_customer_document?: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone?: string
          p_items?: Json
          p_notes?: string
          p_shipping_address?: Json
          p_shop_user_id: string
        }
        Returns: string
      }
      shop_create_order_with_stock: {
        Args: {
          p_customer_document: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_notes?: string
          p_shipping_address: Json
          p_shop_user_id: string
        }
        Returns: string
      }
      shop_user_authenticate: {
        Args: { p_email: string; p_password: string }
        Returns: {
          user_email: string
          user_id: string
          user_name: string
          user_phone: string
          user_status: string
        }[]
      }
      shop_user_register: {
        Args: {
          p_email: string
          p_name: string
          p_password: string
          p_phone?: string
        }
        Returns: string
      }
      shop_user_update_password: {
        Args: {
          p_new_password: string
          p_old_password: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_telegram_buffer_status: {
        Args: {
          p_chat_id: number
          p_draft_product_id?: string
          p_status: string
        }
        Returns: boolean
      }
      update_wizard_session: {
        Args: {
          p_chat_id: number
          p_data?: Json
          p_sale_type?: string
          p_step: string
        }
        Returns: {
          chat_id: number
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          sale_type: string | null
          step: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "telegram_wizard_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_telegram_pending: {
        Args: {
          p_caption?: string
          p_chat_id: number
          p_media_group_id: string
          p_message_id: number
          p_photo_file_id: string
        }
        Returns: undefined
      }
      validate_customer_name: { Args: { name_input: string }; Returns: string }
      validate_email: { Args: { email_input: string }; Returns: string }
      validate_material_name: { Args: { name_input: string }; Returns: string }
      validate_subscription_access: {
        Args: { required_feature?: string; target_user_id: string }
        Returns: boolean
      }
      validate_user_data: {
        Args: {
          p_email: string
          p_nome_completo: string
          p_senha: string
          p_whatsapp: string
        }
        Returns: boolean
      }
      validate_user_data_with_breach_check: {
        Args: {
          p_email: string
          p_nome_completo: string
          p_senha: string
          p_whatsapp: string
        }
        Returns: boolean
      }
      validate_user_input: { Args: { input_text: string }; Returns: string }
    }
    Enums: {
      admin_role: "admin_master" | "admin_operacional" | "suporte" | "leitura"
      app_role: "admin" | "moderator" | "user"
      block_type: "ip" | "user" | "email" | "device"
      content_status: "draft" | "published"
      interactive_event_status:
        | "scheduled"
        | "active"
        | "finished"
        | "cancelled"
      system_module:
        | "caixa"
        | "despesas"
        | "compra"
        | "venda"
        | "estoque"
        | "relatorios"
        | "transacoes"
        | "assinatura"
        | "geral"
        | "campanha"
        | "admin"
        | "indicacoes"
        | "ajuda"
      user_lifecycle_stage:
        | "registered"
        | "activated"
        | "trial"
        | "trial_ending"
        | "paying"
        | "at_risk"
        | "churned"
      user_status: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role: ["admin_master", "admin_operacional", "suporte", "leitura"],
      app_role: ["admin", "moderator", "user"],
      block_type: ["ip", "user", "email", "device"],
      content_status: ["draft", "published"],
      interactive_event_status: [
        "scheduled",
        "active",
        "finished",
        "cancelled",
      ],
      system_module: [
        "caixa",
        "despesas",
        "compra",
        "venda",
        "estoque",
        "relatorios",
        "transacoes",
        "assinatura",
        "geral",
        "campanha",
        "admin",
        "indicacoes",
        "ajuda",
      ],
      user_lifecycle_stage: [
        "registered",
        "activated",
        "trial",
        "trial_ending",
        "paying",
        "at_risk",
        "churned",
      ],
      user_status: ["user", "admin"],
    },
  },
} as const
