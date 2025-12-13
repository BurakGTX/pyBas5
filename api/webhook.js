export default async function handler(req, res) {
  const USER_ID = 3380915154;

  try {
    // PROFİL
    const user = await fetch(
      `https://users.roblox.com/v1/users/${USER_ID}`
    ).then(r => r.json());

    // AVATAR
    const avatar = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${USER_ID}&size=420x420&format=Png`
    ).then(r => r.json());

    // GAME PASS (OLUŞTURULAN)
    let passes = [];
    let cursor = "";

    do {
      const inv = await fetch(
        `https://inventory.roblox.com/v1/users/${USER_ID}/items/GamePass/34?limit=50&cursor=${cursor}`
      ).then(r => r.json());

      if (inv.data) passes.push(...inv.data);
      cursor = inv.nextPageCursor;
    } while (cursor);

    // PASS DETAYLARI (FİYAT)
    const detailedPasses = await Promise.all(
      passes.map(async p => {
        const d = await fetch(
          `https://economy.roblox.com/v1/assets/${p.assetId}/details`
        ).then(r => r.json());

        return {
          id: p.assetId,
          name: d.Name,
          price: d.PriceInRobux,
          forSale: d.IsForSale
        };
      })
    );

    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        description: user.description,
        created: user.created,
        avatar: avatar.data[0].imageUrl
      },
      robux: "PRIVATE (Roblox API kısıtı)",
      gamePassCount: detailedPasses.length,
      gamePasses: detailedPasses
    });

  } catch (e) {
    res.status(500).json({ error: "Roblox API hata verdi" });
  }
}
