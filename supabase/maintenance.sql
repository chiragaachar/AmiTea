-- Run daily as the trusted postgres project administrator, NOT via the Data API.
-- Review these periods against the published campus policy before scheduling.
begin;
delete from public.posts where status='removed' and updated_at<now()-interval '30 days';
delete from public.comments where status='removed' and updated_at<now()-interval '30 days';
delete from public.polls where status='removed' and updated_at<now()-interval '30 days';
delete from public.suggestions where status='removed' and updated_at<now()-interval '30 days';
delete from public.reports where created_at<now()-interval '90 days';
delete from public.moderation_actions where created_at<now()-interval '90 days';
delete from public.user_suspensions where expires_at<now()-interval '30 days';
-- Do not reset live rate buckets. Expired buckets can be reclaimed.
delete from private.rate_limits where window_start<now()-interval '7 days';
commit;
