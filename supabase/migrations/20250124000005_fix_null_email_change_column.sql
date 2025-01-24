-- Fix null email_change column in auth.users table
-- This migration addresses an issue where null values in email_change column
-- were causing scan errors in the auth service

alter table auth.users
  alter column email_change drop not null,
  alter column email_change set default '';

update auth.users
set email_change = ''
where email_change is null; 