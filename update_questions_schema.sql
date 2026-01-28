-- Add missing column for answer explanation
alter table questions 
add column correct_details text;
