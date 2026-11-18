# Guest explore pipeline

1. The landing page opens the domain picker.
2. The picker offers DevOps, DSA, and Web Development and routes to the selected roadmap.
3. The roadmap shows every active phase; only the first phase can be opened as a guest.
4. Lessons in that phase show written notes and non-video links. Curated starter notes fill gaps where seeded topics have no written notes. Video actions display a sign-in prompt.
5. The guest API returns only roadmap metadata and first-phase written material. Existing topic and phase detail APIs require authentication.

The regular authenticated roadmap and topic pages continue using their existing endpoints and behavior.
