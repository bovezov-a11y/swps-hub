-- Which version of the privacy policy each user accepted, so a later policy change can ask them again.
-- Accounts created before the policy existed have no accepted version yet.
alter table users add column privacy_policy_version varchar(20);
alter table users add column privacy_policy_accepted_at timestamptz;
