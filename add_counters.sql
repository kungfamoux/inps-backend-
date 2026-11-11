-- Add missing staff role counters
INSERT INTO counter (id, value) VALUES 
  ('staff_NUR', 1),
  ('staff_ICT', 1),
  ('staff_CLN', 1),
  ('staff_SEC', 1),
  ('staff_OTH', 1)
ON CONFLICT (id) DO NOTHING;
