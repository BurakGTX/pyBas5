let visits = 0;

const fetchJSON = (url) => fetch(url).then(r => r.json());

export default async function handler(req,res){
  const USER_ID = req.query.userId || "3380915154"; // Query parametre ile ID al
  visits++;

  try {
    const user = await fetchJSON(`https://users.roblox.com/v1/users/${USER_ID}`);
    const avatar = await fetchJSON(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${USER_ID}&size=420x420&format=Png`);
    
    let robux=0, friends=0, followers=0, following=0, groupsCount=0;
    try{ robux=(await fetchJSON(`https://economy.roblox.com/v1/users/${USER_ID}/currency`)).robux; }catch{}
    try{ friends=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/friends/count`)).count; }catch{}
    try{ followers=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followers/count`)).count; }catch{}
    try{ following=(await fetchJSON(`https://friends.roblox.com/v1/users/${USER_ID}/followings/count`)).count; }catch{}
    try{ groupsCount=(await fetchJSON(`https://groups.roblox.com/v2/users/${USER_ID}/groups/roles`)).data.length; }catch{}

    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).json({
      user: {id:user.id,name:user.name,description:user.description,created:user.created,avatar:avatar.data[0].imageUrl},
      stats:{robux,friends,followers,following,groups:groupsCount,gamePasses:0,visits}
    });

  } catch(e){
    console.error(e);
    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).json({
      user:{id:USER_ID,name:"Bilinmiyor",description:"",created:"2022-03-10",avatar:""},
      stats:{robux:0,friends:0,followers:0,following:0,groups:0,gamePasses:0,visits}
    });
  }
}
