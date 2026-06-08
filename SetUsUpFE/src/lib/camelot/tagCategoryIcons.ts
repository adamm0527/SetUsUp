import type { SvgIconComponent } from '@mui/icons-material';
import ElectricBoltRounded from '@mui/icons-material/ElectricBoltRounded';
import EqualizerRounded from '@mui/icons-material/EqualizerRounded';
import ViewTimelineRounded from '@mui/icons-material/ViewTimelineRounded';
import WavesRounded from '@mui/icons-material/WavesRounded';
import PianoRounded from '@mui/icons-material/PianoRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import PsychologyAltRounded from '@mui/icons-material/PsychologyAltRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';
import FestivalRounded from '@mui/icons-material/FestivalRounded';
import Diversity1Rounded from '@mui/icons-material/Diversity1Rounded';
import EmojiPeopleRounded from '@mui/icons-material/EmojiPeopleRounded';
import SelfImprovementRounded from '@mui/icons-material/SelfImprovementRounded';
import LabelRounded from '@mui/icons-material/LabelRounded';


// Maps a TagCategory id (3-char code) to the MUI icon component used in the SongCard chip strip.
// All groups inside a category share that category's icon.
// Falls back to a neutral LabelRounded for any unknown category id (defensive against future additions).
const TAG_CATEGORY_ICONS: Record<string, SvgIconComponent> = {
  ENR: ElectricBoltRounded,
  SCH: EqualizerRounded,
  STR: ViewTimelineRounded,
  SFX: WavesRounded,
  SCO: PianoRounded,
  SVO: MicRounded,
  SVI: PsychologyAltRounded,
  THM: AccountBalanceRounded,
  SIT: FestivalRounded,
  FEL: Diversity1Rounded,
  FEX: EmojiPeopleRounded,
  FEI: SelfImprovementRounded,
};

export function getTagCategoryIcon(categoryId: string): SvgIconComponent {
  return TAG_CATEGORY_ICONS[categoryId] ?? LabelRounded;
}

// Helper: given a tagGroupId (e.g. "SCHLF") or a tagId (e.g. "ENRGY04"), pick the category icon.
// Uses the first 3 characters of the id to determine the category.
export function getCategoryIconByGroupOrTagId(groupOrTagId: string): SvgIconComponent {
  return getTagCategoryIcon(groupOrTagId.substring(0, 3));
}
