// Basit, in-memory ziyaretçi sayacı
// Gerçek kullanımda persistent bir DB önerilir ama istek MongoDB vs. olmadan yapılıyor
let totalVisits = 0;

const fetchJSON = (url) => fetch(url).then(r => r.json());

export default async function handler(req,res){
  const USER_ID = "3380915154"; // sadece senin profilin

  totalVisits++; // her API çağrısında 1 artar

  try {
    // Kullanıcı bilgileri
    const user = await fetchJSON(`https://users.roblox.com/v1/users/${USER_ID}`);
    const avatar = await fetchJSON(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${USER_ID}&size=420x420&format=Png`);

    // Robux
    let robux = 0;
    try { robux=(await fetchJSON(`https://economy.roblox.com/v1/users/${USER_ID}/currency`)).robux; } catch{}

    // Diğer istatistikler
    let friends=0, followers=0, following=0, groups=0;
    try{ friends=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/friends/count`)).count; }catch{}
    try{ followers=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followers/count`)).count; }catch{}
    try{ following=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followings/count`)).count; }catch{}
    try{ groups=(await fetchJSON(`https://groups.roblox.com/v2/users/${USER_ID}/groups/roles`)).data.length; }catch{}

    // Game Pass sayısı (placeholder)
    let gamePasses = 0;

    // API yanıtı
    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).json({
      user: {id:user.id,name:user.name,description:user.description,created:user.created,avatar:avatar.data[0].imageUrl},
      stats: {robux,friends,followers,following,groups,gamePasses,visits:totalVisits}
    });

  } catch(e){
    console.error(e);
    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).json({
      user:{id:USER_ID,name:"Bilinmiyor",description:"",created:"2022-03-10",avatar:""},
      stats:{robux:0,friends:0,followers:0,following:0,groups:0,gamePasses:0,visits:totalVisits}
    });
  }
}
