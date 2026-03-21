-- Add Zoom meeting ID and passcode to counselors
ALTER TABLE public.counselors ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;
ALTER TABLE public.counselors ADD COLUMN IF NOT EXISTS zoom_passcode TEXT;
