// Filename substring keywords (case-insensitive).
export const KEYWORDS = {
  headandmusic: "headandmusic",
  hormozi: "hormozi",
  tate: "tate",
  harsh: "harsh",
  men: "men",
  fun: "fun",
  cartoon: "cartoon",
  cool: "cool",
  god: "god",
};

// Groups shown as selectable chips in the Filters UI.
// 'includeAll' means ignore keyword filtering (list everything under prefix).
const VIDEO_GROUPS = [
  {
    id: "fun",
    label: "Fun",
    terms: [KEYWORDS.fun, KEYWORDS.cartoon, KEYWORDS.cool],
    mood: "light, upbeat, playful",
  },
  {
    id: "mellow",
    label: "Mellow Pep Talks",
    terms: [KEYWORDS.headandmusic, KEYWORDS.hormozi, KEYWORDS.cool],
    mood: "encouraging, calm, cool",
  },
  {
    id: "harsh",
    label: "Harsh Realities",
    terms: [KEYWORDS.tate, KEYWORDS.harsh],
    mood: "tough-love, blunt",
  },
  {
    id: "god",
    label: "God",
    terms: [KEYWORDS.god],
    mood: "faith-based, spiritual",
  },
  {
    id: "all",
    label: "Include All",
    terms: [],
    includeAll: true,
    mood: "everything under the folder",
  },
];

export default VIDEO_GROUPS;


