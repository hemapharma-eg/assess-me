-- Run this in the Supabase SQL Editor to create the storage bucket for question images

insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

create policy "Anyone can upload question images"
  on storage.objects for insert
  with check ( bucket_id = 'question-images' );

create policy "Anyone can view question images"
  on storage.objects for select
  using ( bucket_id = 'question-images' );

create policy "Anyone can update question images"
  on storage.objects for update
  using ( bucket_id = 'question-images' );

create policy "Anyone can delete question images"
  on storage.objects for delete
  using ( bucket_id = 'question-images' );
