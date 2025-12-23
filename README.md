# Cabinplace

This repo contains the code for Cabinplace (hackathon dash), which can be used by attendees and staff on hackathons. It includes a news feed, events calendar, user info, leaderboard, in-event shop, and more coming soon!

It works via an Appwrite database, so we can easily update the content during the event.

It also uses Hack Club account as the login system.

## Pages

- **Home**: Displays the latest news and upcoming events (3 of each) as well as experience and time left until Midnight Cabin ends.
- **News**: Shows the latest news.
- **Events**: Shows the calendar of events.
- **Store**: Displays the in-event shop where users can buy items with their experience points.
- **Profile**: Displays user info, including their experience points, invite QR, and team.
- **Leaderboard**: Shows the top users and teams by experience points.
- **Team**: Displays team info and members.
- **Projects**: Displays team's projects.
- **Admin Dashboard**: For event staff to manage news, events, store items...

## Installing, setting up, and running

Coming soon! For now, you can view the live version at [dash.midnightcabin.tech](https://dash.midnightcabin.tech).

## Customization

### Branding
You can customize the branding by setting these environment variables in your `.env` file:
- `NEXT_PUBLIC_APP_NAME`: The name of your event (default: "Event Name")
- `NEXT_PUBLIC_LOGO_URL`: Path to your logo file (default: "/mcab.svg")
- `NEXT_PUBLIC_FAVICON_PATH`: Path to your favicon (default: "/favicon.ico")

### Favicon
The favicon is located at `/public/favicon.ico`. To change it:
1. Replace the file at `/public/favicon.ico` with your own favicon
2. Or update the `NEXT_PUBLIC_FAVICON_PATH` environment variable to point to your favicon location