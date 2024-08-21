import { Button } from "frames.js/next";
import { frames } from "./frames";
import { appURL, formatNumber } from "../utils";

interface State {
  lastFid?: string;
}

interface MoxieData {
  today: { allEarningsAmount: string };
  weekly: { allEarningsAmount: string };
  lifetime: { allEarningsAmount: string };
}

const frameHandler = frames(async (ctx) => {
  interface UserData {
    name: string;
    username: string;
    fid: string;
    socialCapitalScore: string;
    socialCapitalRank: string;
    profileDisplayName: string;
    isPowerUser: boolean;
    profileImageUrl: string;
  }

  let userData: UserData | null = null;
  let moxieData: MoxieData | null = null;

  let error: string | null = null;
  let isLoading = false;

  const fetchUserData = async (fid: string) => {
    isLoading = true;
    try {
      const airstackUrl = `${appURL()}/api/farscore?userId=${encodeURIComponent(
        fid
      )}`;
      const airstackResponse = await fetch(airstackUrl);
      if (!airstackResponse.ok) {
        throw new Error(
          `Airstack HTTP error! status: ${airstackResponse.status}`
        );
      }
      const airstackData = await airstackResponse.json();

      if (
        airstackData.userData.Socials.Social &&
        airstackData.userData.Socials.Social.length > 0
      ) {
        const social = airstackData.userData.Socials.Social[0];
        userData = {
          name: social.profileDisplayName || social.profileName || "Unknown",
          username: social.profileName || "unknown",
          fid: social.userId || "N/A",
          profileDisplayName: social.profileDisplayName || "N/A",
          socialCapitalScore:
            social.socialCapital?.socialCapitalScore?.toFixed(2) || "N/A",
          socialCapitalRank: social.socialCapital?.socialCapitalRank || "N/A",
          isPowerUser: social.isFarcasterPowerUser || false,
          profileImageUrl:
            social.profileImageContentValue?.image?.extraSmall ||
            social.profileImage ||
            "",
        };
      } else {
        throw new Error("No user data found");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      error = (err as Error).message;
    } finally {
      isLoading = false;
    }
  };

  const fetchMoxieData = async (fid: string) => {
    try {
      const moxieUrl = `${appURL()}/api/moxie-earnings?entityId=${encodeURIComponent(
        fid
      )}`;
      const moxieResponse = await fetch(moxieUrl);
      if (!moxieResponse.ok) {
        throw new Error(`Moxie HTTP error! status: ${moxieResponse.status}`);
      }
      moxieData = await moxieResponse.json();
    } catch (err) {
      console.error("Error fetching Moxie data:", err);
      error = (err as Error).message;
    }
  };

  const extractFid = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      let fid = parsedUrl.searchParams.get("userfid");

      console.log("Extracted FID from URL:", fid);
      return fid;
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  };

  let fid: string | null = null;

  if (ctx.message?.requesterFid) {
    fid = ctx.message.requesterFid.toString();
    console.log("Using requester FID:", fid);
  } else if (ctx.url) {
    fid = extractFid(ctx.url.toString());
    console.log("Extracted FID from URL:", fid);
  } else {
    console.log("No ctx.url available");
  }

  if (!fid && (ctx.state as State)?.lastFid) {
    fid = (ctx.state as State).lastFid ?? null;
    console.log("Using FID from state:", fid);
  }

  console.log("Final FID used:", fid);

  const shouldFetchData =
    fid && (!userData || (userData as UserData).fid !== fid);

  if (shouldFetchData && fid) {
    await Promise.all([fetchUserData(fid), fetchMoxieData(fid)]);
  }

  const degenstats = `https://api.degen.tips/airdrop2/allowances?fid=${
    fid ? `${fid}` : ""
  }`;
  
  const degenstatsdata = (await fetch(degenstats));
  console.log(degenstatsdata);

  const degentatsJSON = await degenstatsdata.json();
  console.log(degentatsJSON[0]);

  const degensrank = `https://api.degen.tips/airdrop2/current/points?wallet=${
    degentatsJSON[0].wallet_addresses ? `${degentatsJSON[0].wallet_addresses}` : ""
  }`;

  const degenrankdata = (await fetch(degensrank));
  const degenrankJSON = await degenrankdata.json();
  console.log(degenrankJSON);


  const SplashScreen = () => (
    
      <img 
        src="https://i.imgur.com/iTNnkFc.png"
        tw="w-full h-full object-cover"
      />
     
  );

  const ScoreScreen = () => {
    return (
      <div tw="flex flex-col w-full h-full bg-pink-50 text-blue-800 relative z-auto overflow-visible">
        <div tw="flex flex-col flex-nowrap justify-center items-center box-border w-full sticky -z-50">
          <img
            src="https://i.imgur.com/iTNnkFc.png"
            tw="w-full h-full object-cover"
          />
        </div>
          <img
            src={userData?.profileImageUrl}
            alt="Profile"
            tw="w-47 h-47 absolute z-10 top-53 left-25"
          />
          <div tw="flex w-full absolute bottom-37 left-25 text-left text-[#fff] text-3xl font-sans">
            {userData?.profileDisplayName}
          </div>
          <div tw="flex w-full absolute bottom-23 left-25 text-left text-[#fff] text-2xl">
          <p tw="font-mono">@{userData?.username}</p>
          </div>
        <div tw="flex flex-col flex-nowrap justify-end items-end font-lato box-border w-full absolute top-55 right-30 text-right text-[#fff] text-4xl">
          #{degentatsJSON[0].user_rank}
        </div>
        <div tw="flex flex-col flex-nowrap justify-end items-end italic font-roboto box-border w-full absolute bottom-68 right-30 text-right text-[#fff] text-4xl">
          {degentatsJSON[0].tip_allowance}
        </div>
        <div tw="flex flex-col flex-nowrap justify-end items-end box-border w-full relative bottom-50 right-30 text-right text-[#fff] text-4xl">
          {degentatsJSON[0].remaining_tip_allowance}
        </div>
        <div tw="flex flex-col flex-nowrap justify-end items-end font-nunito box-border w-full relative bottom-30 right-30 text-right text-[#fff] text-4xl">
          {formatNumber(Number(degenrankJSON[0]?.points))}
        </div>
        
      </div>
      
    );
  };
  const shareText = encodeURIComponent(
    userData
      ? `🎩 Check your DEGEN STATS 🎩 Frame created by @tieubochet.eth`
      : "🎩 Check your DEGEN STATS 🎩 Frame created by @tieubochet.eth"
  );

  // Change the url here
  const shareUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=https://check-degen-stats.vercel.app/frames${
    fid ? `?userfid=${fid}` : ""
  }`;

  const buttons = [];

  if (!userData) {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        My Stats
      </Button>
    );
  } else {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        My Stats
      </Button>,
      <Button action="link" target={shareUrl}>
        Share
      </Button>
    );
  }

  return {
    image: fid && !error ? <ScoreScreen /> : <SplashScreen />,
    buttons: buttons,
  };
});

export const GET = frameHandler;
export const POST = frameHandler;
