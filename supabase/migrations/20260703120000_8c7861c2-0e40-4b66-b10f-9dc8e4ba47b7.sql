-- Populate 20 sample requests, attached to an existing real account
-- (looked up by email) rather than creating fake auth.users rows.
-- If no user with this email exists in the target database (e.g. a
-- fresh local/dev environment), this is a no-op.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tgalley@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Skipping sample requests seed: no auth.users row for tgalley@hotmail.com';
    RETURN;
  END IF;

  INSERT INTO public.requests (
    id, user_id, title, description, category, lat, lng, town,
    upvote_count, cosigner_count, view_count, share_count, status, created_at
  ) VALUES
    ('b2222222-0000-0000-0000-000000000001', v_user_id, 'Could the library open on Sundays?', 'Lots of families only have time to visit at the weekend. A few Sunday hours would make a big difference.', 'opening_hours', 53.8008, -1.5491, 'Leeds', 34, 12, 210, 4, 'active', now() - interval '27 days'),
    ('b2222222-0000-0000-0000-000000000002', v_user_id, 'Extend the swimming pool hours in summer', 'The pool closes at 6pm which is too early for working parents to bring their kids after school.', 'opening_hours', 51.4545, -2.5879, 'Bristol', 51, 20, 340, 9, 'active', now() - interval '25 days'),
    ('b2222222-0000-0000-0000-000000000003', v_user_id, 'Bring a proper deli counter to Chorlton', 'We keep hearing about new openings elsewhere in Manchester but never here. Would love a good deli.', 'new_branch', 53.4808, -2.2426, 'Manchester', 18, 6, 122, 2, 'active', now() - interval '23 days'),
    ('b2222222-0000-0000-0000-000000000004', v_user_id, 'Open a second coffee shop branch near the station', 'The queue at the only branch is out the door every morning. A second location would help commuters.', 'new_branch', 51.5074, -0.1278, 'London', 76, 31, 510, 15, 'active', now() - interval '21 days'),
    ('b2222222-0000-0000-0000-000000000005', v_user_id, 'Weekend pottery classes for beginners', 'Would love a relaxed Saturday morning class for people who have never thrown a pot before.', 'classes_sessions', 50.8225, -0.1372, 'Brighton', 22, 9, 165, 3, 'active', now() - interval '19 days'),
    ('b2222222-0000-0000-0000-000000000006', v_user_id, 'Evening yoga sessions at the community centre', 'A weekday evening slot would suit people who work during the day but still want to unwind.', 'classes_sessions', 51.7520, -1.2577, 'Oxford', 29, 11, 198, 5, 'active', now() - interval '18 days'),
    ('b2222222-0000-0000-0000-000000000007', v_user_id, 'Bring a local folk band to the bandstand', 'The bandstand sits empty most weekends. Local musicians would love the stage time and it would draw a crowd.', 'artist_visit', 53.9600, -1.0873, 'York', 14, 5, 90, 1, 'active', now() - interval '16 days'),
    ('b2222222-0000-0000-0000-000000000008', v_user_id, 'Street art mural workshop with a visiting artist', 'A hands-on mural day for teenagers over the summer holidays, led by a professional street artist.', 'artist_visit', 51.4545, -2.5879, 'Bristol', 41, 17, 280, 8, 'active', now() - interval '14 days'),
    ('b2222222-0000-0000-0000-000000000009', v_user_id, 'Confirm the farmers market schedule for autumn', 'Please publish the autumn dates early this year so stallholders and shoppers can plan ahead.', 'announcement', 52.6309, 1.2974, 'Norwich', 9, 3, 60, 0, 'active', now() - interval '13 days'),
    ('b2222222-0000-0000-0000-00000000000a', v_user_id, 'Update on the town square renovation', 'It has been quiet for months. An update on timelines would reassure local shop owners.', 'announcement', 52.9548, -1.1581, 'Nottingham', 25, 10, 150, 4, 'active', now() - interval '12 days'),
    ('b2222222-0000-0000-0000-00000000000b', v_user_id, 'More benches along the riverside walk', 'Great for elderly residents and parents with young kids to rest during a longer walk.', 'nature_outdoors', 52.2053, 0.1218, 'Cambridge', 37, 14, 230, 6, 'active', now() - interval '11 days'),
    ('b2222222-0000-0000-0000-00000000000c', v_user_id, 'Wildflower meadow in the park', 'Turning a section of mowed grass into a wildflower meadow would be great for bees and butterflies.', 'nature_outdoors', 53.3811, -1.4701, 'Sheffield', 48, 19, 305, 11, 'active', now() - interval '10 days'),
    ('b2222222-0000-0000-0000-00000000000d', v_user_id, 'Outdoor cinema nights in summer', 'Free or cheap outdoor screenings in the park would be a lovely addition to the summer calendar.', 'culture_art', 51.4816, -3.1791, 'Cardiff', 33, 13, 210, 7, 'active', now() - interval '9 days'),
    ('b2222222-0000-0000-0000-00000000000e', v_user_id, 'Local history exhibition at the museum', 'A small exhibition on the town''s Georgian history would be a great draw for visitors and residents alike.', 'culture_art', 51.3811, -2.3590, 'Bath', 16, 6, 105, 2, 'active', now() - interval '8 days'),
    ('b2222222-0000-0000-0000-00000000000f', v_user_id, 'Free repair café once a month', 'A monthly drop-in where volunteers help fix broken appliances and clothes instead of throwing them away.', 'community_service', 54.9783, -1.6178, 'Newcastle', 44, 18, 260, 9, 'active', now() - interval '7 days'),
    ('b2222222-0000-0000-0000-000000000010', v_user_id, 'Volunteer litter-picking group', 'Setting up a regular Sunday morning litter pick along the seafront and nearby streets.', 'community_service', 50.9097, -1.4044, 'Southampton', 20, 8, 140, 3, 'active', now() - interval '6 days'),
    ('b2222222-0000-0000-0000-000000000011', v_user_id, 'A floating sauna on the canal', 'Seen these pop up in other cities and it would be a fun, low-cost addition to the waterfront.', 'wild_idea', 52.4862, -1.8904, 'Birmingham', 62, 27, 400, 20, 'active', now() - interval '5 days'),
    ('b2222222-0000-0000-0000-000000000012', v_user_id, 'Turn the old phone box into a mini library', 'The disused phone box on the corner is an eyesore. A book-swap mini library would put it to good use.', 'wild_idea', 55.9533, -3.1883, 'Edinburgh', 39, 15, 245, 10, 'active', now() - interval '4 days'),
    ('b2222222-0000-0000-0000-000000000013', v_user_id, 'After-school coding club', 'A free weekly coding club for 8-14 year olds run by local volunteers from the tech scene.', 'classes_sessions', 55.8642, -4.2518, 'Glasgow', 31, 12, 200, 6, 'active', now() - interval '3 days'),
    ('b2222222-0000-0000-0000-000000000014', v_user_id, 'Christmas lights switch-on date', 'Please confirm the date early this year so families can plan to come into town for the evening.', 'announcement', 53.4084, -2.9916, 'Liverpool', 27, 10, 175, 5, 'active', now() - interval '2 days')
  ON CONFLICT (id) DO NOTHING;
END $$;
