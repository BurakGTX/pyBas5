import { MongoClient } from "mongodb";

const USER_ID = 3380915154;
const client = new MongoClient(process.env.MONGO_URI);

const fetchJSON = (url) => fetch(url).then(r => r.json());

export default async function handler(req, res) {
  try {
    // MongoDB bağlan
    await client.connect();
    const db = client.db("analytics");
    const coll = db.collection("visits");

    // Site ziyaret sayacı
    const result = await coll.findOneAndUpdate(
      { page: "index" },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    // Roblox API çağrıları
    const user = await fetchJSON(`https://users.roblox.com/v1/users/${USER_ID}`);
    const avatar = await fetchJSON(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${USER_ID}&size=420x420&format=Png`);
    const robuxData = await fetchJSON(`https://economy.roblox.com/v1/users/${USER_ID}/currency`);
    const friendsCount = await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/friends/count`);
    const followersCount = await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followers/count`);
    const followingCount = await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followings/count`);
    const groups = await fetchJSON(`https://groups.roblox.com/v2/users/${USER_ID}/groups/roles`);

    // Game Pass örnek (Inventory)
    let passes = [];
    let cursor = "";
    do {
      const inv = await fetchJSON(`https://inventory.roblox.com/v1/users/${USER_ID}/items/GamePass/34?limit=50&cursor=${cursor}`);
      if(inv.data) passes.push(...inv.data);
      cursor = inv.nextPageCursor;
    } while(cursor);

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
        robux: robuxData.robux ?? 0,
        friends: friendsCount.count ?? 0,
        followers: followersCount.count ?? 0,
        following: followingCount.count ?? 0,
        groups: groups.data.length ?? 0,
        gamePasses: passes.length ?? 0,
        visits: result.value.count ?? 1
      }
    });

  } catch (e) {
    console.error("API hata:", e);
    res.status(500).json({ error: "API çağrısı başarısız" });
  }
}
