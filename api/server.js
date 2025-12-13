let visitsMap = {}; // key:userId -> visits

const fetchJSON = (url) => fetch(url).then(r=>r.json());

export default async function handler(req,res){
  const USER_ID = req.query.userId || "3380915154";

  // ziyaretçi sayısı
  visitsMap[USER_ID] = (visitsMap[USER_ID]||0) + 1;

  try {
    const user = await fetchJSON(`https://users.roblox.com/v1/users/${USER_ID}`);
    const avatar = await fetchJSON(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${USER_ID}&size=420x420&format=Png`);
    
    // Robux
    let robux = 0;
    try { robux=(await fetchJSON(`https://economy.roblox.com/v1/users/${USER_ID}/currency`)).robux; } catch{}
    
    // Stats
    let friends=0, followers=0, following=0, groups=0;
    try{ friends=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/friends/count`)).count; }catch{}
    try{ followers=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followers/count`)).count; }catch{}
    try{ following=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followings/count`)).count; }catch{}
    try{ groups=(await fetchJSON(`https://groups.roblox.com/v2/users/${USER_ID}/groups/roles`)).data.length; }catch{}

    // Game Pass sayısı (placeholder)
    let gamePasses = 0; // Gerçek Game Pass çekmek için Roblox API yetki gerekir

    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).json({
      user:{id:user.id,name:user.name,description:user.description,created:user.created,avatar:avatar.data[0].imageUrl},
      stats:{robux,friends,followers,following,groups,gamePasses,visits:visitsMap[USER_ID]}
    });

  } catch(e){
    console.error(e);
    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).json({
      user:{id:USER_ID,name:"Bilinmiyor",description:"",created:"2022-03-10",avatar:""},
      stats:{robux:0,friends:0,followers:0,following:0,groups:0,gamePasses:0,visits:0}
    });
  }
}
