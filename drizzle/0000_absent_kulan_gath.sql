CREATE TYPE "public"."equipment" AS ENUM('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other');--> statement-breakpoint
CREATE TYPE "public"."link_status" AS ENUM('pending', 'active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'gif');--> statement-breakpoint
CREATE TYPE "public"."muscle_group" AS ENUM('chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'full_body');--> statement-breakpoint
CREATE TYPE "public"."pr_type" AS ENUM('max_weight', 'max_reps_at_weight', 'best_e1rm');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'accepted', 'dismissed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."suggestion_type" AS ENUM('increase', 'decrease', 'deload');--> statement-breakpoint
CREATE TYPE "public"."technique_rating" AS ENUM('good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."technique_source" AS ENUM('manual', 'camera');--> statement-breakpoint
CREATE TYPE "public"."training_mode" AS ENUM('heavy', 'failure', 'progressive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('athlete', 'trainer', 'admin');--> statement-breakpoint
CREATE TABLE "exercise_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"kind" "media_kind" NOT NULL,
	"url" text NOT NULL,
	"contentful_asset_id" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"size_bytes" integer NOT NULL,
	"alt" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_media_position" UNIQUE("exercise_id","position"),
	CONSTRAINT "exercise_media_limits" CHECK ("exercise_media"."position" between 0 and 5 and "exercise_media"."width" >= 320 and "exercise_media"."size_bytes" <= 5242880)
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"muscle_group" "muscle_group" NOT NULL,
	"secondary_muscles" text[] DEFAULT '{}'::text[] NOT NULL,
	"equipment" "equipment" NOT NULL,
	"instructions" text NOT NULL,
	"technique_cues" text[] NOT NULL,
	"common_mistakes" text[] NOT NULL,
	"default_increment_kg" numeric(5, 2) DEFAULT '2.5' NOT NULL,
	"technique_camera_supported" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"type" "pr_type" NOT NULL,
	"value" numeric NOT NULL,
	"weight_kg" numeric(6, 2),
	"reps" integer,
	"session_id" uuid NOT NULL,
	"achieved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"routine_exercise_id" uuid,
	"session_id" uuid NOT NULL,
	"type" "suggestion_type" NOT NULL,
	"from_weight_kg" numeric(6, 2) NOT NULL,
	"suggested_weight_kg" numeric(6, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"weekday" integer,
	CONSTRAINT "routine_days_position" UNIQUE("routine_id","position"),
	CONSTRAINT "routine_days_weekday" CHECK ("routine_days"."weekday" is null or "routine_days"."weekday" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"sets" integer NOT NULL,
	"rep_min" integer NOT NULL,
	"rep_max" integer NOT NULL,
	"rest_seconds" integer NOT NULL,
	"mode" "training_mode" NOT NULL,
	"tempo" text,
	"notes" text,
	"is_warmup_suggested" boolean DEFAULT false NOT NULL,
	"target_weight_kg" numeric(6, 2),
	"increment_override_kg" numeric(5, 2),
	"progression_sessions_required" integer DEFAULT 1 NOT NULL,
	"technique_required" boolean DEFAULT true NOT NULL,
	CONSTRAINT "routine_exercises_position" UNIQUE("day_id","position"),
	CONSTRAINT "routine_exercises_limits" CHECK ("routine_exercises"."sets" between 1 and 10 and "routine_exercises"."rep_min" >= 1 and "routine_exercises"."rep_min" <= "routine_exercises"."rep_max" and "routine_exercises"."rep_max" <= 50 and "routine_exercises"."rest_seconds" between 0 and 600 and ("routine_exercises"."rest_seconds" % 5)=0 and "routine_exercises"."progression_sessions_required" between 1 and 3 and ("routine_exercises"."tempo" is null or length("routine_exercises"."tempo") <= 20) and ("routine_exercises"."notes" is null or length("routine_exercises"."notes") <= 500))
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"start_date" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"routine_exercise_id" uuid,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"exercise_name" text NOT NULL,
	"prescribed_sets" integer NOT NULL,
	"prescribed_rep_min" integer NOT NULL,
	"prescribed_rep_max" integer NOT NULL,
	"prescribed_rest_seconds" integer NOT NULL,
	"mode" "training_mode" NOT NULL,
	"technique" "technique_rating",
	"technique_source" "technique_source" DEFAULT 'manual' NOT NULL,
	"rpe" numeric(3, 1),
	"notes" text,
	"completed_at" timestamp with time zone,
	CONSTRAINT "session_exercises_rpe" CHECK ("session_exercises"."rpe" is null or "session_exercises"."rpe" between 5 and 10)
);
--> statement-breakpoint
CREATE TABLE "set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" numeric(6, 2) NOT NULL,
	"reps" integer NOT NULL,
	"is_warmup" boolean DEFAULT false NOT NULL,
	"is_failure" boolean DEFAULT false NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "set_logs_number" UNIQUE("session_exercise_id","set_number"),
	CONSTRAINT "set_logs_limits" CHECK ("set_logs"."weight_kg" between 0 and 500 and "set_logs"."reps" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "trainer_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"status" "link_status" DEFAULT 'pending' NOT NULL,
	"requested_by" uuid NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trainer_links_pair" UNIQUE("trainer_id","athlete_id"),
	CONSTRAINT "trainer_links_distinct" CHECK ("trainer_links"."trainer_id" <> "trainer_links"."athlete_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"google_sub" text,
	"role" "user_role" DEFAULT 'athlete' NOT NULL,
	"rest_default_seconds" integer DEFAULT 90 NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"unit_pref" text DEFAULT 'kg' NOT NULL,
	"disabled_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub"),
	CONSTRAINT "users_rest_check" CHECK ("users"."rest_default_seconds" between 0 and 600)
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"routine_id" uuid,
	"routine_day_id" uuid,
	"day_name" text NOT NULL,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "exercise_media" ADD CONSTRAINT "exercise_media_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_suggestions" ADD CONSTRAINT "progression_suggestions_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_suggestions" ADD CONSTRAINT "progression_suggestions_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_suggestions" ADD CONSTRAINT "progression_suggestions_routine_exercise_id_routine_exercises_id_fk" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_suggestions" ADD CONSTRAINT "progression_suggestions_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_days" ADD CONSTRAINT "routine_days_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_day_id_routine_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."routine_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_routine_exercise_id_routine_exercises_id_fk" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_session_exercise_id_session_exercises_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."session_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_links" ADD CONSTRAINT "trainer_links_trainer_id_users_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_links" ADD CONSTRAINT "trainer_links_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_links" ADD CONSTRAINT "trainer_links_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_day_id_routine_days_id_fk" FOREIGN KEY ("routine_day_id") REFERENCES "public"."routine_days"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_name_active" ON "exercises" USING btree (lower("name")) WHERE "exercises"."archived_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "suggestions_one_pending" ON "progression_suggestions" USING btree ("routine_exercise_id") WHERE "progression_suggestions"."status"='pending';--> statement-breakpoint
CREATE INDEX "suggestions_athlete_status" ON "progression_suggestions" USING btree ("athlete_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "routines_one_active" ON "routines" USING btree ("athlete_id") WHERE "routines"."is_active"=true;--> statement-breakpoint
CREATE INDEX "session_exercises_lookup" ON "session_exercises" USING btree ("exercise_id","session_id");--> statement-breakpoint
CREATE INDEX "set_logs_session_exercise" ON "set_logs" USING btree ("session_exercise_id");--> statement-breakpoint
CREATE INDEX "trainer_links_athlete_status" ON "trainer_links" USING btree ("athlete_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_one_in_progress" ON "workout_sessions" USING btree ("athlete_id") WHERE "workout_sessions"."status"='in_progress';--> statement-breakpoint
CREATE INDEX "sessions_athlete_started" ON "workout_sessions" USING btree ("athlete_id","started_at");