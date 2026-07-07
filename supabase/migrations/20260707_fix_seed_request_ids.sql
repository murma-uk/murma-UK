-- Fix seed data request IDs to be unique (seed.sql originally created them all with a1111111 prefix)
-- This migration updates only requests that still have the problematic ID pattern

UPDATE public.requests SET id = '550e8400-e29b-41d4-a716-446655440001' WHERE title = 'Could the library open on Sundays?' AND town = 'Leeds';
UPDATE public.requests SET id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8' WHERE title = 'Extend the swimming pool hours in summer' AND town = 'Bristol';
UPDATE public.requests SET id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' WHERE title = 'Bring a proper deli counter to Chorlton' AND town = 'Manchester';
UPDATE public.requests SET id = 'a5484b9e-ad4a-4c18-a3b5-4c3c6a8e8e0c' WHERE title = 'Open a second coffee shop branch near the station' AND town = 'London';
UPDATE public.requests SET id = 'b6b9c8f6-5e4b-4c9a-8d1e-9c3d8e5e6d7a' WHERE title = 'Weekend pottery classes for beginners' AND town = 'Brighton';
UPDATE public.requests SET id = 'c7c9d9e7-6f5c-5d0b-9e2f-0d4e9f6f7e8b' WHERE title = 'Evening yoga sessions at the community centre' AND town = 'Oxford';
UPDATE public.requests SET id = 'd8d0e0f8-7a6d-6e1c-af3a-1e5f0a7a8f9c' WHERE title = 'Bring a local folk band to the bandstand' AND town = 'York';
UPDATE public.requests SET id = 'e9e1f1f9-8b7e-7f2d-ab4b-2f6a1b8b9a0d' WHERE title = 'Street art mural workshop with a visiting artist' AND town = 'Bristol';
UPDATE public.requests SET id = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' WHERE title = 'Confirm the farmers market schedule for autumn' AND town = 'Norwich';
UPDATE public.requests SET id = '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e' WHERE title = 'Update on the town square renovation' AND town = 'Nottingham';
UPDATE public.requests SET id = '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f' WHERE title = 'More benches along the riverside walk' AND town = 'Cambridge';
UPDATE public.requests SET id = '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a' WHERE title = 'Wildflower meadow in the park' AND town = 'Sheffield';
UPDATE public.requests SET id = '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b' WHERE title = 'Outdoor cinema nights in summer' AND town = 'Cardiff';
UPDATE public.requests SET id = '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c' WHERE title = 'Local history exhibition at the museum' AND town = 'Bath';
UPDATE public.requests SET id = '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d' WHERE title = 'Free repair café once a month' AND town = 'Newcastle';
UPDATE public.requests SET id = '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e' WHERE title = 'Volunteer litter-picking group' AND town = 'Southampton';
UPDATE public.requests SET id = '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f' WHERE title = 'A floating sauna on the canal' AND town = 'Birmingham';
UPDATE public.requests SET id = 'ad1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a' WHERE title = 'Turn the old phone box into a mini library' AND town = 'Edinburgh';
UPDATE public.requests SET id = 'be2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b' WHERE title = 'After-school coding club' AND town = 'Glasgow';
UPDATE public.requests SET id = 'cf3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c' WHERE title = 'Christmas lights switch-on date' AND town = 'Liverpool';
