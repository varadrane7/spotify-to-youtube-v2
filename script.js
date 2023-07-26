const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const readline = require("readline");
const url = require("url");
const { URLSearchParams } = require("url");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Load Spotify API credentials
let credentials;
try {
	credentials = require("./spotify_credentials.json");
} catch (e) {
	console.error("Error loading Spotify credentials:", e);
	process.exit(1);
}

async function main() {
	const browser = await puppeteer.launch({ headless: false });

	console.log("Enter Spotify playlist URL:");
	rl.question("", async (spotifyPlaylistUrl) => {
		const spotifyPlaylistId = url
			.parse(spotifyPlaylistUrl)
			.pathname.split("/")
			.pop();

		const params = new URLSearchParams();
		params.append("grant_type", "client_credentials");

		const auth = Buffer.from(
			`${credentials.SPOTIFY_CLIENT_ID}:${credentials.SPOTIFY_CLIENT_SECRET}`
		).toString("base64");

		// Get an access token from Spotify
		const response = await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			body: params,
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
		const data = await response.json();

		// Use the access token to access the Spotify Web API
		const spotifyResponse = await fetch(
			`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}`,
			{
				headers: {
					Authorization: `Bearer ${data.access_token}`,
				},
			}
		);
		const playlist = await spotifyResponse.json();

		const trackDetails = playlist.tracks.items.map((item) => {
			const track = item.track;
			return {
				trackName: track.name,
				artistName: track.artists[0].name,
			};
		});

		console.log(`Found ${trackDetails.length} tracks in Spotify playlist.`);

		// Continue in Puppeteer
		const page = await browser.newPage();

		// Browse to YouTube
		await page.goto("https://youtube.com");

		console.log("Please sign into YouTube manually, then press Enter here...");
		rl.question("", async () => {
			// TODO: Continue processing `trackDetails` here, using Puppeteer's page object.

			rl.close();
			await browser.close();
		});
	});
}

main();
