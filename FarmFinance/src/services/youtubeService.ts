import { Linking } from 'react-native';

const YOUTUBE_TOKEN = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
const GOOGLE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

export type YoutubeVideo = {
  id: string;
  title: string;
  channel: string;
  thumb: string;
  url: string;
  description: string;
};

// MULTI-PROTOCOL GOOGLE FETCH (FOR DUAL-PRIORITY)
const tryGoogleSearch = async (query: string): Promise<YoutubeVideo[] | null> => {
    try {
        const response = await fetch(`${GOOGLE_API_URL}?part=snippet&q=${query}&type=video&key=${YOUTUBE_TOKEN}&maxResults=10`, {
            headers: { 'Authorization': `Bearer ${YOUTUBE_TOKEN}`, 'Accept': 'application/json' }
        });
        const data = await response.json();
        if (data?.items?.length > 0) {
            return data.items.map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                description: item.snippet.description || '',
                thumb: item.snippet.thumbnails.high.url,
                url: `https://youtube.com/watch?v=${item.id.videoId}`
            }));
        }
    } catch (e) { return null; }
    return null;
};

// SINGLE MIRROR FETCH (FOR PARALLEL SCAN)
const fetchMirror = async (baseUrl: string, query: string): Promise<YoutubeVideo[]> => {
    try {
        const isPiped = baseUrl.includes('piped');
        const endpoint = isPiped ? `/search?q=${query}&filter=all` : `/api/v1/search?q=${query}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 Second Sprint Timeout

        const response = await fetch(`${baseUrl}${endpoint}`, { 
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        const items = isPiped ? (data?.items || []) : (data || []);
        const valid = items.filter((i: any) => i.videoId || (i.url && i.url.includes('?v=')));

        if (valid.length > 0) {
            return valid.slice(0, 5).map((i: any) => {
                const vid = i.videoId || i.url.split('v=')[1];
                return { 
                  id: vid, 
                  title: i.title, 
                  channel: i.uploaderName || i.author || "Expert", 
                  description: i.shortDescription || i.description || "Field Research Guide", 
                  thumb: i.thumbnail || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`, 
                  url: `https://youtube.com/watch?v=${vid}` 
                };
            });
        }
    } catch(e) { return []; }
    return [];
};

export const searchYoutubeVideos = async (query: string): Promise<YoutubeVideo[]> => {
  const q = query.toLowerCase().trim();
  if (['hi', 'hello', 'hey', 'greetings', 'morning'].includes(q)) {
      return [];
  }

  const SEARCH_QUERY = encodeURIComponent(query + ' farming agriculture cultivation');
  
  // PARALLEL SPRINT: FIRE ALL REQUESTS AT ONCE
  try {
      const results = await Promise.allSettled([
          tryGoogleSearch(SEARCH_QUERY),
          fetchMirror('https://invidious.snopyta.org', SEARCH_QUERY),
          fetchMirror('https://inv.vern.cc', SEARCH_QUERY),
          fetchMirror('https://invidious.slipfox.xyz', SEARCH_QUERY),
          fetchMirror('https://api-piped.mha.fi', SEARCH_QUERY)
      ]);

      // EXTRACT FIRST SUCCESSFUL DATA SET
      for (const res of results) {
          if (res.status === 'fulfilled' && res.value && res.value.length > 0) {
              return res.value;
          }
      }
  } catch (error) {
      console.warn("Global Sprint Failed - Mirror Recovery Active...");
  }

  // LAST RESORT DYNAMIC FALLBACK
  if (query.toLowerCase().includes('rice') || query.toLowerCase().includes('farming')) {
      return [{ id: 'u6P9J0mZ_wI', title: 'Technical Guide for Rice Cultivation', channel: 'Agri-Experts', description: 'Advanced paddy farming research.', thumb: 'https://img.youtube.com/vi/u6P9J0mZ_wI/hqdefault.jpg', url: 'https://youtube.com/watch?v=u6P9J0mZ_wI' }];
  }

  return []; 
};

export const openYoutubeSearch = (query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' agriculture guide')}`;
    Linking.openURL(url);
};
