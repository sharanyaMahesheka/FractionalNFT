

export const GetIpfsUrlFromPinata = (pinataUrl) => {
    console.log("TEST");
    console.log(pinataUrl);
    // if(IPFSUrl == undefined){
    //     return ;
    // }
    try{
        var IPFSUrl = pinataUrl.split("/");
        const lastIndex = IPFSUrl.length;
        IPFSUrl = "https://ipfs.moralis.io:2053/ipfs/"+IPFSUrl[lastIndex-1];
    } 
    catch(e) {
        console.log(e);
    }  
    return IPFSUrl;
};