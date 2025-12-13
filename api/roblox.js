export default async function handler(req, res) {
  const USER_ID = 3380915154;

  try {
    const fetchJSON = (url) => fetch(url).then(r => r.json());

    const user = await fetchJSON(
      `https://users.roblox.com/v1/users/${USER_ID}`
    );

    const avatar = await fetchJSON(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${USER_ID}&size=420x420&format=Png`
    );

    const robuxData = await fetchJSON(
      `https://economy.roblox.com/v1/users/${USER_ID}/currency`
    );

    const friendsCount = await fetchJSON(
      `https://friends.roblox.com/v1/users/${USER_ID}/friends/count`
    );

    const followersCount = await fetchJSON(
      `https://friends.roblox.com/v1/users/${USER_ID}/followers/count`
    );

    const followingCount = await fetchJSON(
      `https://friends.roblox.com/v1/users/${USER_ID}/followings/count`
    );

    const groups = await fetchJSON(
      `https://groups.roblox.com/v2/users/${USER_ID}/groups/roles`
    );

    let passes = [];
    let cursor = "";
    do {
      const inv = await fetchJSON(
        `https://inventory.roblox.com/v1/users/${USER_ID}/items/GamePass/34?limit=50&cursor=${cursor}`
      );
      if (inv.data) passes.push(...inv.data);
      cursor = inv.nextPageCursor;
    } while (cursor);

    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        description: user.description,
        created: user.created,
        avatar: avatar.data[0].imageUrl
      },
      stats: {
        robux: robuxData.robux,
        friends: friendsCount.count,
        followers: followersCount.count,
        following: followingCount.count,
        groups: groups.data.length,
        gamePasses: passes.length
      }
    });

  } catch (e) {
    res.status(500).json({ error: "Roblox API error" });
  }
}
