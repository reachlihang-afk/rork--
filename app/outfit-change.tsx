// outfit-change-new.tsx - 完整版
// 新UI设计 + 完整功能集成

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Camera, Sparkles, Lock, X, ArrowLeft, Download, Share2, Check, Eye, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoin } from '@/contexts/CoinContext';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';
import { saveToGallery } from '@/utils/share';

type TabType = 'template' | 'custom' | 'pro';

// AI Prompt前缀
const COMMON_PROMPT_PREFIX = 'IMPORTANT: Keep face, facial expression, hairstyle, pose, and photo framing EXACTLY as in original. Only change clothing in the EXACT visible areas. If only partial clothing is visible, apply only to that partial area. Do NOT extend or complete the image. ';

// 高级感后缀 - 提升所有模板的品质感
const LUXURY_QUALITY_SUFFIX = '. High-end designer quality, premium luxurious fabrics with beautiful texture and drape, impeccable tailoring with perfect fit, sophisticated color palette, elegant refined details, professional fashion editorial photography quality';

// 21个精选模板（含前沿穿搭）- 升级版高级感 Prompt
const TEMPLATES = [
  { id: 'random', name: '随机装', nameEn: 'Random', icon: '🎲', prompt: 'RANDOM_PLACEHOLDER' },
  { id: 'frontier', name: '前沿穿搭', nameEn: 'Frontier', icon: '✨', prompt: 'FRONTIER_PLACEHOLDER' },
  { id: 'neo-digital', name: '数字霓虹', nameEn: 'Neo-Digital', icon: '🌈', prompt: 'NEO_DIGITAL_PLACEHOLDER' },
  { id: 'bikini', name: '泳装', nameEn: 'Swimwear', icon: '👙', prompt: 'luxury designer swimwear in elegant style, high-end resort collection quality like Zimmermann or Eres, sophisticated beach glamour with flattering cut, premium fabric with beautiful drape, chic summer elegance perfect for St. Tropez or Maldives resort' },
  { id: 'formal', name: '正装', nameEn: 'Formal', icon: '👔', prompt: 'premium tailored business suit in luxurious Italian wool fabric, perfectly fitted blazer with sharp structured shoulders, high-quality silk blouse underneath, sophisticated executive style as seen in Vogue Business editorial, impeccable Savile Row craftsmanship, elegant minimalist accessories, powerful yet refined professional look' },
  { id: 'sport', name: '运动装', nameEn: 'Sports', icon: '🏃', prompt: 'luxury athleisure wear from premium brands like Lululemon or Alo Yoga, high-performance fabric with sleek modern design, sophisticated sporty-chic aesthetic, flattering athletic silhouette, muted elegant color palette, fitness fashion editorial quality, stylish enough for brunch after workout' },
  { id: 'fairytale-princess', name: '童话公主装', nameEn: 'Princess', icon: '👸', prompt: 'breathtaking haute couture princess ball gown, luxurious silk organza and tulle layers, intricate hand-sewn beading and crystal embellishments, Elie Saab or Zuhair Murad inspired elegance, romantic ethereal silhouette with dramatic train, royal sophistication worthy of a European palace, fantasy bridal editorial quality' },
  { id: 'old-money', name: '老钱风', nameEn: 'Old Money', icon: '💰', prompt: 'quiet luxury old money aesthetic, sumptuous cashmere sweater draped elegantly over shoulders, fine pearl jewelry, Loro Piana or Brunello Cucinelli quality fabrics, understated inherited wealth elegance, preppy New England sophistication, The Row or Ralph Lauren Purple Label inspired styling, absolutely no visible logos, muted refined neutral tones in cream beige and navy, timelessly elegant aristocratic taste' },
  { id: 'tennis', name: '网球装', nameEn: 'Tennis', icon: '🎾', prompt: 'elegant country club tennis attire, crisp white premium performance fabric with subtle texture, flattering pleated tennis skirt, sophisticated preppy athletic style like Lacoste or Tory Sport, refined sporty elegance perfect for Wimbledon or exclusive tennis club, clean minimalist design with impeccable tailoring' },
  { id: 'ski', name: '滑雪服', nameEn: 'Ski', icon: '⛷️', prompt: 'luxury designer ski wear from Moncler or Bogner, sleek high-performance jacket with premium down insulation, sophisticated alpine chic aesthetic, elegant color-blocked design, perfect for Aspen or St. Moritz slopes, fashionable yet functional winter sports elegance, après-ski ready glamour' },
  { id: 'lolita', name: '洛丽塔', nameEn: 'Lolita', icon: '🎀', prompt: 'exquisite Japanese Lolita fashion dress, delicate hand-made lace and ribbon details, high-quality cotton and organza fabrics, intricate Victorian-inspired design, elegant gothic or sweet Lolita aesthetic from brands like Angelic Pretty or Baby The Stars Shine Bright, romantic doll-like sophistication with impeccable craftsmanship' },
  { id: 'punk', name: '朋克装', nameEn: 'Punk', icon: '🎸', prompt: 'high-fashion punk rock ensemble, premium Italian leather jacket with silver hardware, designer distressed denim, Balmain or Saint Laurent inspired edgy luxury, rebellious yet sophisticated attitude, runway-worthy rock chic aesthetic, bold statement pieces with impeccable construction quality' },
  { id: 'wedding', name: '婚纱', nameEn: 'Wedding', icon: '👰', prompt: 'breathtaking haute couture wedding gown, luxurious French lace and silk satin, intricate hand-sewn beading and embroidery, Vera Wang or Monique Lhuillier inspired elegance, romantic flowing silhouette with cathedral train, bridal editorial perfection worthy of Vogue Weddings cover, timeless sophisticated bridal beauty' },
  { id: 'traditional', name: '汉服', nameEn: 'Hanfu', icon: '🏮', prompt: 'exquisite traditional Chinese Hanfu in premium silk brocade, intricate hand-embroidered patterns with gold and silver threads, elegant flowing sleeves and graceful silhouette, museum-quality craftsmanship inspired by Tang or Ming dynasty court attire, sophisticated cultural elegance with luxurious fabric sheen and beautiful drape' },
  { id: 'superhero', name: '超级英雄', nameEn: 'Superhero', icon: '🦸', prompt: 'high-budget Hollywood superhero costume, premium metallic and leather materials with sophisticated design, Marvel or DC cinematic quality construction, powerful heroic silhouette with sleek modern aesthetic, professional movie-grade costume design with impeccable details and luxurious finish' },
  { id: 'starbucks-barista', name: '星巴克', nameEn: 'Starbucks', icon: '☕', prompt: 'authentic Starbucks barista uniform with signature green apron, crisp clean professional appearance, friendly coffee shop aesthetic, well-fitted comfortable workwear with neat presentation, genuine barista look ready to craft artisanal beverages' },
  { id: 'hot-girl', name: '辣妹装', nameEn: 'Hot Girl', icon: '🔥', prompt: 'trendy hot girl aesthetic with designer edge, figure-flattering bodycon dress or stylish two-piece set, Jacquemus or Cult Gaia inspired sexy sophistication, confident glamorous style perfect for Miami or LA nightlife, premium fabrics with impeccable fit, Instagram-worthy fashion influencer look with luxurious finish' },
  { id: 'cowboy', name: '牛仔装', nameEn: 'Cowboy', icon: '🤠', prompt: 'elevated Western cowboy style with luxury twist, premium suede or leather jacket with fringe details, high-end denim from brands like R13 or Citizens of Humanity, sophisticated ranch aesthetic meets high fashion, Isabel Marant or Ralph Lauren Western Collection inspired, rodeo chic with impeccable tailoring and luxurious materials' },
  { id: 'outdoor', name: '户外装', nameEn: 'Outdoor', icon: '🏔️', prompt: 'luxury outdoor adventure wear from Arc teryx Veilance or Patagonia, high-performance technical fabric with sleek minimalist design, sophisticated gorpcore aesthetic, premium hiking and camping attire that transitions seamlessly to urban settings, functional elegance with impeccable construction quality' },
  { id: 'flight-attendant', name: '空姐装', nameEn: 'Flight', icon: '✈️', prompt: 'elegant airline cabin crew uniform from prestigious carrier like Emirates or Singapore Airlines, perfectly tailored blazer and pencil skirt in sophisticated navy or burgundy, silk scarf with elegant knot, polished professional appearance with impeccable grooming, first-class service elegance with luxurious fabric quality' },
  { id: 'god-of-wealth', name: '财神装', nameEn: 'Wealth God', icon: '💸', prompt: 'magnificent Chinese God of Wealth (Caishen) costume, luxurious imperial red and gold silk brocade with intricate dragon and auspicious symbol embroidery, elaborate traditional headdress, premium theatrical costume quality worthy of Chinese New Year celebration, prosperous festive elegance with opulent golden details and rich fabric textures' },
];

// 随机风格库 - 完整版157种风格
const RANDOM_OUTFIT_STYLES = [
  'Hot trendy girl style - crop top, mini skirt, bold streetwear',
  'Meituan delivery uniform - yellow and black branded outfit',
  'Luxury designer ski wear - sleek jacket fully zipped with ski goggles',
  'Flight attendant uniform - elegant airline uniform with scarf',
  'Outdoor adventure clothing - hiking jacket, cargo pants, functional gear',
  'Western cowboy style - denim jeans, boots, plaid shirt, western hat',
  'Magical wizard costume - flowing robes with pointed hat, mystical style',
  'Pirate costume - tricorn hat, eye patch, pirate coat, seafarer style',
  'Fairytale princess dress - magical elegant gown with tiara and royal charm',
  'Lolita fashion - frilly dresses, lace, bows, petticoats with sweet/classic/goth styles',
  'Visual kei rock style - dramatic layered outfits, bold makeup-inspired fashion with dark elegant vibe',
  'Punk style - leather jackets, studs, tartan, ripped details with rebellious attitude',
  
  // 扩展风格库 - 80+种额外风格
  '1950s vintage pin-up style - high-waisted skirt, polka dots, retro glamour',
  '1960s mod fashion - geometric patterns, mini dress, go-go boots, bold colors',
  '1970s disco style - bell bottoms, platform shoes, sequined top, funky patterns',
  '1980s power suit - shoulder pads, bold colors, executive business style',
  '1990s grunge aesthetic - flannel shirt, ripped jeans, combat boots, layered look',
  '2000s Y2K fashion - low-rise jeans, butterfly clips, metallic fabrics, futuristic',
  'Elegant evening gown - floor-length formal dress with sophisticated design',
  'Cocktail party dress - chic knee-length dress with stylish accessories',
  'Bohemian festival outfit - flowing maxi dress, fringe details, flower crown',
  'Preppy school uniform - pleated skirt, blazer, tie, academic style',
  'Gothic lolita fashion - Victorian-inspired dress with dark romantic style',
  'Kawaii Japanese street style - colorful layers, cute accessories, playful fashion',
  'Harajuku decora fashion - bright colors, multiple accessories, maximalist style',
  'Korean ulzzang style - trendy oversized clothing, soft colors, stylish casual',
  'Minimalist Scandinavian fashion - clean lines, neutral tones, simple elegance',
  'Parisian chic style - striped shirt, beret, elegant trench coat, effortless',
  'Italian luxury fashion - designer pieces, bold patterns, sophisticated style',
  'British mod style - tailored pieces, classic patterns, refined look',
  'American preppy ivy league - cable knit sweater, khakis, loafers, classic',
  'Streetwear hypebeast - branded hoodies, sneakers, urban fashion, trendy',
  'Athleisure workout gear - yoga pants, sports bra, stylish athletic wear',
  'Balletcore aesthetic - tulle skirt, ballet flats, delicate feminine style',
  'Dark academia - tweed blazer, turtleneck, vintage scholarly aesthetic',
  'Light academia - cream colors, cardigans, romantic scholarly style',
  'Cottagecore pastoral - prairie dress, floral patterns, countryside charm',
  'Fairycore whimsical - ethereal flowing dress, nature-inspired, magical',
  'Goblincore earthy - oversized layers, mushroom prints, forest aesthetic',
  'Mermaidcore oceanic - iridescent fabrics, shell accessories, aquatic theme',
  'Royalcore regal - velvet, gold details, crown, luxurious royal style',
  'Regencycore historical - empire waist dress, Jane Austen inspired elegance',
  'Victorian era fashion - corset, bustle skirt, lace details, period costume',
  'Edwardian style - high collar blouse, long skirt, Gibson girl aesthetic',
  'Flapper 1920s - fringe dress, headband, art deco glamour',
  'Rockabilly style - polka dot dress, leather jacket, retro pinup',
  'Punk rock fashion - leather jacket, studs, ripped clothing, rebellious',
  'Emo alternative style - black skinny jeans, band tee, layered hair accessories',
  'Scene kid aesthetic - neon colors, tutus, bold makeup style clothing',
  'Soft girl aesthetic - pastel colors, oversized sweater, cute skirts',
  'E-girl style - striped shirt, chain accessories, alternative internet fashion',
  'VSCO girl outfit - scrunchies, oversized tee, trendy casual beach style',
  'Baddie aesthetic - bodycon dress, designer accessories, confident style',
  'Clean girl aesthetic - sleek hair, minimal jewelry, polished simple look',
  'That girl aesthetic - matching set, organized style, aspirational fashion',
  'Barbiecore hot pink - all pink outfit, glamorous Barbie-inspired style',
  'Tomboy athletic - baggy jeans, oversized shirt, sporty comfortable style',
  'Androgynous fashion - gender-neutral suit, minimalist unisex style',
  'Cyberpunk futuristic - neon accents, tech-wear, dystopian urban style',
  'Steampunk Victorian - gears, goggles, brass details, industrial fantasy',
  'Witchy mystic - flowing dark robes, moon symbols, magical bohemian',
  'Hippie peace style - tie-dye, bell sleeves, flower power, free spirit',
  'Safari explorer - khaki utility vest, cargo shorts, adventure ready',
  'Tropical vacation - bright floral print, beach resort casual style',
  'Nautical sailor - navy stripes, white pants, maritime classic style',
  'Equestrian riding - jodhpurs, riding boots, polo style, horse rider',
  'Figure skating costume - sparkly dress, athletic elegance, ice rink style',
  'Ballerina performance - classical tutu, pointe shoes, graceful dance attire',
  'Flamenco dancer - ruffled red dress, Spanish passionate style',
  'Belly dancer costume - jeweled bra top, flowing pants, Middle Eastern',
  'Traditional Japanese kimono - elegant silk robe with obi belt, cultural',
  'Indian sari - draped silk fabric, ornate jewelry, traditional elegance',
  'Scottish highland - tartan kilt, sporran, bagpiper traditional dress',
  'German dirndl - traditional Bavarian dress, folk costume, Oktoberfest',
  'Mexican folklorico - colorful embroidered dress, traditional festive',
  'Russian kokoshnik - traditional headdress with ornate dress, folk style',
  'Egyptian pharaoh - gold jewelry, white linen, ancient royal costume',
  'Greek goddess - flowing white toga, gold accents, classical mythology',
  'Roman centurion - armor, red cape, ancient military costume',
  'Medieval knight - armor suit, shield, chivalrous warrior style',
  'Renaissance faire - corset bodice, full skirt, historical costume',
  'Samurai warrior - traditional armor, hakama, Japanese martial style',
  'Geisha traditional - elaborate kimono, white makeup style, cultural',
  'Flapper jazz age - beaded dress, feather headband, roaring twenties',
  'Pin-up girl retro - high-waisted shorts, crop top, vintage glamour',
  'Burlesque performer - corset, feather boa, theatrical glamorous style',
  'Circus ringmaster - red jacket, top hat, theatrical performer style',
  'Mime artist - striped shirt, beret, theatrical black and white',
  'Clown entertainer - colorful baggy outfit, playful costume',
  'Chef professional - white coat, toque hat, culinary uniform',
  'Doctor medical - white coat, stethoscope, professional healthcare',
  'Firefighter uniform - protective gear, reflective stripes, heroic',
  'Police officer - uniform, badge, law enforcement professional',
  'Astronaut space suit - NASA style, futuristic space explorer',
  'Scuba diver - wetsuit, diving gear, underwater explorer',
  'Beekeeper protective - white suit, veil hat, beekeeping attire',
  'Construction worker - hard hat, reflective vest, safety gear',
  'Farmer overall - denim overalls, plaid shirt, agricultural worker',
  'Gardener casual - apron, gloves, green thumb practical style',
  'Librarian vintage - cardigan, glasses, books, intellectual style',
  'Secretary 1960s - pencil skirt, blouse, professional retro office',
  'Waitress diner - retro uniform, apron, classic restaurant style',
  'Maid Victorian - black dress, white apron, classic servant costume',
  'Butler formal - tailcoat, white gloves, sophisticated service attire',
  'Mechanic work - coveralls, tool belt, automotive repair practical',
  'Artist painter - paint-splattered smock, beret, creative bohemian',
  'Photographer vest - utility vest with pockets, professional casual',
  'DJ performer - headphones, trendy streetwear, music producer style',
  'Rockstar stage - leather pants, studded jacket, concert performer',
  'Pop star concert - sparkly costume, bold stage outfit, performer',
  'Rapper hip-hop - oversized chains, branded clothing, urban style',
  'Country singer - cowboy hat, boots, Nashville stage style',
  'Opera singer - elaborate gown, dramatic classical performance attire',
];

// 随机选择一种风格的函数
function getRandomOutfitStyle(): string {
  const randomIndex = Math.floor(Math.random() * RANDOM_OUTFIT_STYLES.length);
  return RANDOM_OUTFIT_STYLES[randomIndex];
}

// ========== 2026前沿穿搭风格库 - 100种最前沿时尚趋势 ==========
// 基于 WGSN、Vogue Runway、SSENSE、NET-A-PORTER 等前沿时尚网站的2026趋势预测
const FRONTIER_FASHION_STYLES = [
  // ===== A. 2026色彩趋势 (10种) =====
  'Transformative Teal ensemble - deep teal blazer with matching wide-leg trousers, minimalist silver accessories, 2026 WGSN color of the year',
  'Dusty Blue monochrome - powder blue silk blouse with dusty blue midi skirt, soft elegance, tonal dressing',
  'Butter Yellow soft gradient - cream to yellow ombre knit dress, delicate gold jewelry, warm sunshine aesthetic',
  'Electric Coral statement - bold coral structured dress with architectural shoulders, confident power dressing',
  'Mocha Earth tones - rich brown cashmere coat over camel turtleneck, sophisticated neutral palette',
  'Lavender Haze dreamy - lilac organza layered outfit with iridescent details, ethereal romantic style',
  'Neon Volt accent - black tailored suit with neon yellow belt and accessories, bold contrast pop',
  'Forest Moss green - olive linen jumpsuit with botanical embroidery, nature-inspired sustainable chic',
  'Sunset Ombre dramatic - gradient dress from orange to deep magenta, flowing silhouette, artistic statement',
  'Pewter Metallic shimmer - gunmetal satin dress with reflective finish, futuristic luxury evening wear',

  // ===== B. 廓形与剪裁趋势 (15种) =====
  'Balloon Pants silhouette - ultra-wide sculptural pants with fitted crop top, dramatic volume contrast',
  'Hyper-Volume puff sleeves - oversized statement sleeves on structured bodice, architectural drama',
  'Sculptural Asymmetric dress - one-shoulder gown with abstract draping, gallery-worthy fashion art',
  'Puddle Hem pants - extra-long trouser pooling at ankles, relaxed tailoring with platform shoes',
  'Cocoon Coat oversized - enveloping wool coat with soft rounded shoulders, effortless luxury',
  'Micro Mini with maxi coat - contrast of ultra-short hemline with floor-length outerwear',
  'Barrel Silhouette jacket - curved structured jacket cinched at waist, bold 3D shape',
  'Dropped Waist revival - 1920s inspired low waistline with pleated skirt, vintage modernized',
  'Cape Blazer hybrid - tailored jacket with flowing cape back, elegant movement',
  'Bubble Hem cocktail dress - sculptural puffed hemline with fitted bodice, playful sophistication',
  'Deconstructed Tailoring - asymmetric blazer with exposed seams, avant-garde reconstruction',
  'Column Dress minimal - sleek floor-length sheath, ultra-minimal Greek goddess simplicity',
  'Trapeze A-line modern - structured swing silhouette, 60s mod updated for 2026',
  'Corseted Outerwear - blazer with visible corset boning, structure meets sensuality',
  'Tiered Ruffles cascading - dramatic layered dress with romantic movement, red carpet worthy',

  // ===== C. 材质与工艺趋势 (15种) =====
  'Sheer Organza layers - transparent fabric layered over structured base, ethereal visibility',
  'Liquid Metal satin - molten silver or gold fabric dress, high-shine liquid effect',
  'Crinkled Tissue texture - intentionally wrinkled lightweight fabric, artistic imperfection',
  '3D Floral appliqué - hand-sewn dimensional flowers on structured dress, couture craft',
  'Laser-Cut precision - geometric cut-out patterns in leather or fabric, futuristic detail',
  'Hand-Knit chunky - oversized artisanal cable knit sweater, slow fashion luxury',
  'Feather Trim delicate - ostrich or marabou feather hem and cuffs, romantic glamour',
  'Sequin Gradient ombre - sequins transitioning colors across garment, disco modernized',
  'Sustainable Recycled couture - upcycled vintage fabrics remade into contemporary design',
  'Pleated Issey Miyake style - architectural micro-pleating throughout, sculptural fabric',
  'Velvet Burnout pattern - devore technique with sheer and velvet contrast, textured luxury',
  'Patent Leather accent - high-gloss vinyl or leather details on minimal base',
  'Faux Fur statement - ethical luxury fluffy texture in bold colors, cozy glamour',
  'Woven Raffia natural - straw and natural fiber integrated into structured clothing',
  'Holographic Iridescent - color-shifting fabrics catching light, futuristic fantasy',

  // ===== D. 前沿街头风格 (15种) =====
  'Quiet Luxury SSENSE - minimal cashmere, no logos, understated expensive elegance',
  'Gorpcore elevated - technical outdoor gear styled with luxury accessories, function meets fashion',
  'Blokecore sporty - oversized football jersey with tailored trousers, ironic sporty',
  'Indie Sleaze revival - 2000s party girl: mini skirt, tank top, messy glamour returned',
  'Mob Wife aesthetic - leopard print fur, oversized gold jewelry, bold confidence',
  'Office Siren corporate - fitted pencil skirt, silk blouse unbuttoned, powerful sexy',
  'Coquette feminine - bows, ribbons, lace, ultra-girly romantic soft aesthetic',
  'Clean Girl polish - slicked bun, minimal jewelry, polished natural beauty style',
  'Coastal Grandmother ease - linen pants, cashmere cardigan, seaside old money',
  'Tomato Girl summer - red sundress, espadrilles, Mediterranean vacation energy',
  'Eclectic Grandpa vintage - oversized cardigans, pleated trousers, cozy intellectual',
  'Balletcore romantic - tulle skirt, wrap top, ballet flats, dancer-inspired grace',
  'Tenniscore athletic - pleated mini skirt, polo shirt, sporty preppy fusion',
  'Motorcycle Moto edge - leather jacket, boots, jeans, rebellious cool minimalist',
  'Normcore upgraded - basic elevated with premium fabrics, intentionally ordinary chic',

  // ===== E. 性别流动与中性风 (10种) =====
  'Androgynous Power suit - oversized unisex blazer, wide trousers, gender-neutral tailoring',
  'Fluid Silk set - unisex silk shirt and pants set, soft draping, no gender boundaries',
  'Boyfriend Blazer oversized - borrowed-from-him proportions, relaxed shoulder, rolled sleeves',
  'Gender-neutral Jumpsuit - utilitarian one-piece in neutral tones, universal design',
  'Masc-Fem fusion - structured blazer over flowing skirt, masculine meets feminine',
  'Unisex Streetwear layers - oversized hoodie, baggy pants, sneakers, universal urban',
  'Soft Tailoring neutral - deconstructed suit in beige, relaxed gender-fluid elegance',
  'Menswear for Her - pinstripe vest, wide trousers, oxford shoes, borrowed masculinity',
  'Fluid Proportion play - cropped top with extra-wide pants, proportion experimentation',
  'Neo-Dandy refined - waistcoat, high-waisted trousers, pocket square, modern dandy',

  // ===== F. 复古融合趋势 (10种) =====
  'Y2K Metallic revival - low-rise silver pants, butterfly top, early 2000s nostalgia updated',
  '70s Disco Glam return - bell-bottom jumpsuit, platform heels, Saturday Night Fever energy',
  '90s Minimalism reimagined - slip dress, thin straps, minimal jewelry, CK era updated',
  '60s Mod geometric - shift dress with bold color blocks, Twiggy-inspired modern',
  '80s Power Dressing now - strong shoulders, bold colors, executive glamour contemporary',
  'Regencycore Bridgerton - empire waist gown, puff sleeves, romantic period drama style',
  'Medieval Fantasy modern - corseted bodice, long sleeves, fantasy renaissance fusion',
  'Victorian Goth romantic - high collar, lace details, dark romantic elegance',
  'Art Deco 20s flapper - beaded fringe dress, headband, geometric patterns, jazz age',
  'Space Age 60s futurism - white go-go boots, geometric dress, retro-future optimism',

  // ===== G. 戏剧与高定感 (10种) =====
  'Castlecore Medieval drama - velvet cape, crown jewelry, dramatic royalty aesthetic',
  'Red Carpet sculptural - architectural gown with dramatic train, award-show worthy',
  'Opera Glamour evening - full-length velvet with statement jewelry, theatrical elegance',
  'Avant-Garde experimental - deconstructed asymmetric design, fashion as art statement',
  'Couture Feathered gown - all-over feather dress, luxury craftsmanship, showstopper',
  'Statement Shoulder drama - extreme padded or sculpted shoulders, power silhouette',
  'Floor-Length Cape dramatic - flowing cape coat over minimal dress, regal presence',
  'Crystal Embellished luxury - beaded and crystal detailed dress, sparkling opulence',
  'Dramatic Train gown - dress with extended train, ceremonial fashion moment',
  'Theatrical Ruffle explosion - layers of ruffles in gradient colors, maximalist romance',

  // ===== H. 可持续时尚 (5种) =====
  'Zero-Waste design - pattern-cut to eliminate waste, sustainable construction elegance',
  'Upcycled Vintage remix - repurposed vintage pieces combined into contemporary design',
  'Organic Natural fibers - hemp, organic cotton, linen blend, earth-conscious luxury',
  'Carbon-Neutral fashion - sustainably produced with minimal environmental impact, conscious chic',
  'Repair-Visible mending - Japanese Boro-inspired visible repairs as design feature',

  // ===== I. 场景主题穿搭 (10种) =====
  'Milan Fashion Week street - designer layering, bold accessories, photographed-worthy style',
  'Copenhagen minimalist - Scandi design, clean lines, muted colors, effortless cool',
  'Tokyo Harajuku experimental - bold color mixing, avant-garde layers, fearless creativity',
  'Paris Left Bank intellectual - striped shirt, beret, cigarette pants, literary chic',
  'New York Power Woman - sharp tailoring, heels, confident stride, Manhattan energy',
  'London Punk-meets-Posh - tartan, leather, mixing high and low, British irreverence',
  'Seoul K-Fashion blend - oversized layers, gender-neutral, trendy streetwear innovation',
  'Los Angeles Laid-Back luxe - relaxed fits, premium basics, California ease with wealth',
  'Berlin Techno minimal - all black, functional fashion, underground cool aesthetic',
  'Sydney Beach-to-Bar transition - resort wear that works for cocktails, effortless versatility',
];

// 随机选择一种前沿风格的函数
function getRandomFrontierStyle(): string {
  const randomIndex = Math.floor(Math.random() * FRONTIER_FASHION_STYLES.length);
  return FRONTIER_FASHION_STYLES[randomIndex];
}

// ========== Neo-Digital 数字霓虹风格库 - 20种未来科技感穿搭 ==========
const NEO_DIGITAL_STYLES = [
  // 色彩主导款
  'Digital Lavender holographic bodysuit with iridescent shimmer, glowing seams, futuristic silhouette emitting soft purple light',
  'Cyber Lime neon ensemble - electric green transparent TPU jacket over liquid metal silver bodycon, self-luminous fabric effect',
  'Iridescent rainbow shift dress with color-changing holographic surface, prismatic light reflection, ethereal glow',
  'Aurora Borealis gradient outfit - flowing colors from digital lavender to cyber lime, light-emitting fiber accents',
  'Chromatic silver liquid metal gown with pooling reflective fabric, mirror-like surface catching all light',
  
  // 材质科技款
  'Transparent TPU sculptural coat with visible 3D-printed internal structure, cicada-wing translucent aesthetic',
  'Liquid metal satin dress flowing like mercury, high-shine chrome finish with organic draping',
  'Fiber optic woven top with embedded light channels glowing softly, paired with structural metallic pants',
  '3D-printed exoskeleton bodice with geometric lattice structure over sheer base layer, architectural fashion',
  'Holographic PVC trench coat with rainbow refraction, transparent yet color-shifting material',
  
  // 建筑剪裁款
  'Architectural shoulder statement - extreme padded geometric shoulders in silver metallic, deconstructed asymmetric silhouette',
  'Exoskeleton-style structured jacket with external ribbing detail, cyber armor aesthetic in chrome and lavender',
  'Asymmetric deconstructed dress with one dramatic sculptural sleeve, exposed structural seams, avant-garde construction',
  'Origami-fold metallic mini dress with sharp geometric pleats, 3D angular silhouette, futuristic precision',
  'Cage-structure outer layer over iridescent inner garment, skeletal framework fashion, see-through architecture',
  
  // 融合未来款
  'Neo-Tokyo street style - oversized cyber jacket with LED trim, holographic accessories, digital age urban',
  'Metaverse-ready outfit - reflective bodysuit with augmented reality-inspired graphic overlays, virtual fashion aesthetic',
  'Blade Runner inspired ensemble - sleek black with neon accent lighting, dystopian luxury, rain-slick metallic finish',
  'Tron legacy suit - form-fitting with glowing circuit patterns, electric blue light lines on black base',
  'Space age couture - silver bubble silhouette with transparent helmet-inspired collar, astronaut meets high fashion',
];

// 随机选择一种 Neo-Digital 风格的函数
function getRandomNeoDigitalStyle(): string {
  const randomIndex = Math.floor(Math.random() * NEO_DIGITAL_STYLES.length);
  return NEO_DIGITAL_STYLES[randomIndex];
}

export default function OutfitChangeNewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentLanguage } = useLanguage();
  const params = useLocalSearchParams();
  
  // 根据语言获取模板名称
  const getTemplateName = (template: { name: string; nameEn: string }) => {
    return currentLanguage === 'zh' ? template.name : template.nameEn;
  };
  
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { coinBalance, canUseOutfitChange, useOutfitChange, getRemainingFreeCounts } = useCoin();
  const { addOutfitChangeHistory, markAsPublished } = useVerification();
  const { publishPost } = useSquare();
  const { showAlert } = useAlert();
  
  // 获取剩余免费次数
  const { outfitChange: freeOutfitChangeCount } = getRemainingFreeCounts();

  // 状态管理
  const [selectedTab, setSelectedTab] = useState<TabType>('template');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ 
    original: string;        // 原图（模板模式=用户照片，自定义模式=参考服饰）
    result: string; 
    templateName: string;
    customOutfitImages?: string[];  // 自定义模式下的所有参考服饰图片
    userPhoto?: string;             // 自定义模式下保存的用户照片
    historyId?: string;             // 历史记录ID
  } | null>(null);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const [largeImageType, setLargeImageType] = useState<'original' | 'result'>('result');
  
  // 生成计时器
  const [generatingTime, setGeneratingTime] = useState(0);
  const generatingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 滚动相关
  const scrollViewRef = useRef<ScrollView>(null);
  const resultSectionY = useRef<number>(0);
  
  // 生成计时器效果
  useEffect(() => {
    if (isGenerating) {
      setGeneratingTime(0);
      generatingTimerRef.current = setInterval(() => {
        setGeneratingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (generatingTimerRef.current) {
        clearInterval(generatingTimerRef.current);
        generatingTimerRef.current = null;
      }
      setGeneratingTime(0);
    }
    
    return () => {
      if (generatingTimerRef.current) {
        clearInterval(generatingTimerRef.current);
      }
    };
  }, [isGenerating]);
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };
  
  // Pro Style相关状态
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [selectedLookPrompt, setSelectedLookPrompt] = useState<string | null>(null);
  
  // 发布到广场状态
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showOriginalInPost, setShowOriginalInPost] = useState(false); // 默认不展示原图

  const getWritableDirectory = () => {
    const fsAny = FileSystem as unknown as {
      documentDirectory?: string | null;
      cacheDirectory?: string | null;
    };
    return fsAny.documentDirectory ?? fsAny.cacheDirectory ?? '';
  };

  // 打开发布弹窗
  const handleOpenPublishModal = () => {
    if (!generatedResult || !user) {
      if (!user) {
        Alert.alert(t('common.tip'), t('square.loginRequired'));
      }
      return;
    }
    setShowOriginalInPost(false); // 重置开关为默认关闭
    setShowPublishModal(true);
  };

  // 确认发布到广场
  const handleConfirmPublish = async () => {
    if (!generatedResult || !user) return;

    setShowPublishModal(false);
    setIsPublishing(true);
    try {
      await publishPost({
        userId: user.userId,
        userNickname: user.nickname || user.userId,
        userAvatar: user.avatar,
        postType: 'outfitChange',
        outfitChangeId: `outfit_${Date.now()}`,
        originalImageUri: generatedResult.original,
        resultImageUri: generatedResult.result,
        templateName: generatedResult.templateName,
        customOutfitImages: generatedResult.customOutfitImages,
        showOriginal: showOriginalInPost, // 传递是否展示原图的选项
        pinnedCommentId: undefined,
      });

      setIsPublished(true);
      
      // 标记历史记录为已发布
      if (generatedResult.historyId) {
        try {
          await markAsPublished(generatedResult.historyId);
        } catch (e) {
          console.error('Failed to mark as published:', e);
        }
      }
      
      showAlert({
        type: 'success_confirm',
        title: t('common.success'),
        message: t('square.publishSuccessPrompt'),
        confirmText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onConfirm: () => {
          // 跳转到广场页面
          router.push('/(tabs)/square');
        }
      });
    } catch (error) {
      console.error('Publish to square failed:', error);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('square.publishFailed')
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 保存到相册
  const handleSaveToGallery = async (uri: string) => {
    try {
      const success = await saveToGallery(uri);
      if (success) {
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('outfitChange.downloadSuccess')
        });
      } else {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('outfitChange.downloadFailed')
        });
      }
    } catch (error) {
      console.error('Save to gallery failed:', error);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('outfitChange.downloadFailed')
      });
    }
  };

  // 分享图片
  const handleShare = async (uri: string) => {
    try {
      let localUri = uri;
      if (uri.startsWith('data:')) {
        const base64Data = uri.split(',')[1];
        const baseDir = getWritableDirectory();
        if (!baseDir) {
          throw new Error('No writable directory available');
        }
        const filename = `${baseDir}temp_share_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: 'base64',
        });
        localUri = filename;
      }
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('common.tip'), '分享功能在当前设备上不可用');
        return;
      }
      await Sharing.shareAsync(localUri);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // 从首页传来的照片URI
  useEffect(() => {
    if (params.photoUri && typeof params.photoUri === 'string') {
      setUserImage(params.photoUri);
    }
  }, [params.photoUri]);

  // 从influencer collection返回的数据
  useEffect(() => {
    if (params.mode === 'pro' && params.lookPrompt) {
      setSelectedTab('pro');
      setSelectedInfluencerId(typeof params.influencerId === 'string' ? params.influencerId : null);
      setSelectedLookPrompt(typeof params.lookPrompt === 'string' ? params.lookPrompt : null);
    }
  }, [params.mode, params.lookPrompt, params.influencerId]);

  // 上传照片
  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.tip'), t('outfitChange.mediaLibraryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('上传失败:', error);
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  // 拍照
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.tip'), '需要相机权限');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
    }
  };

  // 添加自定义服饰图片
  const handleAddCustomImage = async () => {
    if (customImages.length >= 2) {
      Alert.alert(t('common.tip'), t('outfitChange.maxImagesReached'));
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.tip'), t('outfitChange.mediaLibraryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setCustomImages([...customImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('添加失败:', error);
    }
  };

  // 删除自定义图片
  const handleRemoveCustomImage = (index: number) => {
    setCustomImages(customImages.filter((_, i) => i !== index));
  };


  // Web平台图片压缩函数
  const compressImageWeb = async (blob: Blob, maxWidth: number = 800, quality: number = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (Platform.OS !== 'web') {
        resolve(blob);
        return;
      }
      
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 等比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              resolve(compressedBlob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };

  // 转换图片为Base64
  const convertToBase64 = async (uri: string, compress: boolean = true, isMainImage: boolean = false): Promise<string> => {
    if (Platform.OS === 'web') {
      try {
        console.log('[convertToBase64] Converting web image:', uri.substring(0, 100));
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        let blob = await response.blob();
        console.log('[convertToBase64] Original blob size:', blob.size, 'bytes');
        
        // 强制压缩所有图片以避免413错误
        if (compress) {
          console.log('[convertToBase64] Compressing image...');
          // 极度激进的压缩参数以确保请求体不会太大
          const maxWidth = isMainImage ? 480 : 360;
          const quality = isMainImage ? 0.45 : 0.35;
          blob = await compressImageWeb(blob, maxWidth, quality);
          console.log('[convertToBase64] After first compression:', blob.size, 'bytes');
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            const sizeInKB = Math.round(base64Data.length / 1024);
            console.log('[convertToBase64] Conversion complete, base64 size:', sizeInKB, 'KB');
            
            // 如果base64数据仍然太大（>400KB），进行二次压缩
            if (compress && base64Data.length > 400000) {
              console.log('[convertToBase64] Data still too large (', sizeInKB, 'KB), applying aggressive secondary compression...');
              // 重新压缩为更小的尺寸和更低质量
              fetch(uri)
                .then(res => res.blob())
                .then(newBlob => compressImageWeb(newBlob, isMainImage ? 360 : 280, 0.25))
                .then(finalBlob => {
                  const finalReader = new FileReader();
                  finalReader.onloadend = () => {
                    const finalBase64 = (finalReader.result as string).split(',')[1];
                    console.log('[convertToBase64] Secondary compression complete, final length:', finalBase64.length, 'bytes');
                    resolve(finalBase64);
                  };
                  finalReader.onerror = reject;
                  finalReader.readAsDataURL(finalBlob);
                })
                .catch(reject);
            } else {
              resolve(base64Data);
            }
          };
          reader.onerror = (error) => {
            console.error('[convertToBase64] FileReader error:', error);
            reject(error);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('[convertToBase64] Web conversion error:', error);
        throw new Error('图片转换失败，请重新选择图片');
      }
    } else {
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      return base64String;
    }
  };

  // 构建Prompt
  const buildPrompt = (): string => {
    if (selectedTab === 'template' && selectedTemplate) {
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      if (!template) return '';

      if (template.id === 'random') {
        const style = getRandomOutfitStyle();
        return COMMON_PROMPT_PREFIX + `Change the outfit to: ${style}`;
      } else if (template.id === 'frontier') {
        const frontierStyle = getRandomFrontierStyle();
        return COMMON_PROMPT_PREFIX + `Transform into cutting-edge 2026 fashion trend. Style: ${frontierStyle}. Create a high-fashion editorial look with professional styling, modern silhouettes, and trend-forward aesthetic. The result should look like it belongs in Vogue or SSENSE editorial.`;
      } else if (template.id === 'neo-digital') {
        const neoDigitalStyle = getRandomNeoDigitalStyle();
        return COMMON_PROMPT_PREFIX + `Transform into Neo-Digital futuristic fashion. Style: ${neoDigitalStyle}. 
        
KEY VISUAL ELEMENTS:
- COLORS: Digital Lavender, Cyber Lime, Iridescent holographic, self-luminous glow effect like light emanating from a screen
- MATERIALS: Liquid metal satin, transparent TPU (cicada-wing translucent plastic), fiber optic glowing threads, 3D-printed structural elements
- SILHOUETTE: Architectural construction, exaggerated sculptural shoulders, asymmetric deconstruction, exoskeleton-like external framework details

Create a cutting-edge cyberpunk meets high fashion look. The outfit should appear to glow and shimmer with futuristic technology embedded in the fabric. Professional sci-fi fashion editorial quality.`;
      } else {
        return COMMON_PROMPT_PREFIX + `Change the outfit to: ${template.prompt}${LUXURY_QUALITY_SUFFIX}`;
      }
    } else if (selectedTab === 'custom' && customImages.length > 0) {
      return COMMON_PROMPT_PREFIX + 'Apply the clothing style from the reference images to the person, matching colors, patterns, and design details exactly.';
    } else if (selectedTab === 'pro' && selectedLookPrompt) {
      // Pro Style: 使用从influencer collection传来的prompt
      return `Transform this person to match the influencer's look. Keep the person's face identity and body proportions exactly. Change the outfit, pose, background, and overall styling to match: ${selectedLookPrompt}`;
    }
    return '';
  };

  // 开始生成
  const handleGenerate = async () => {
    // 验证
    if (!userImage) {
      showAlert({
        type: 'info',
        message: t('outfitChange.selectImage')
      });
      return;
    }

    if (selectedTab === 'template' && !selectedTemplate) {
      showAlert({
        type: 'info',
        message: t('outfitChange.selectImageAndTemplate')
      });
      return;
    }

    if (selectedTab === 'custom' && customImages.length === 0) {
      showAlert({
        type: 'info',
        message: t('outfitChange.selectOutfitImages')
      });
      return;
    }

    if (selectedTab === 'pro' && !selectedLookPrompt) {
      showAlert({
        type: 'info',
        message: '请先从达人页面选择一个造型'
      });
      return;
    }

    // 检查金币
    const canUse = await canUseOutfitChange();
    if (!canUse) {
      Alert.alert(
        t('common.tip'),
        t('outfitChange.insufficientCoins'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('profile.recharge'),
            onPress: () => router.push('/recharge' as any)
          }
        ]
      );
      return;
    }

    setIsGenerating(true);

    try {
      console.log('[OutfitChange] Starting generation, tab:', selectedTab);
      
      // 始终启用压缩以避免413错误
      const base64Image = await convertToBase64(userImage, true, true); // 强制压缩主图
      console.log('[OutfitChange] Main image converted, size:', base64Image.length);
      
      let requestBody: any;
      
      if (selectedTab === 'template') {
        // 模板模式
        const finalPrompt = buildPrompt();
        
        requestBody = {
          prompt: finalPrompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        };
        console.log('[OutfitChange] Template mode request body prepared');
        
      } else if (selectedTab === 'custom') {
        // 自定义穿搭模式
        console.log('[OutfitChange] Custom mode, converting', customImages.length, 'outfit images');
        
        try {
          const outfitBase64Images = await Promise.all(
            customImages.map(async (uri, index) => {
              console.log(`[OutfitChange] Converting outfit image ${index + 1}/${customImages.length}`);
              const base64 = await convertToBase64(uri, true, false); // 启用压缩，这是服饰图（非主图）
              console.log(`[OutfitChange] Outfit image ${index + 1} converted, size:`, base64.length);
              return base64;
            })
          );
          
          const prompt = `CRITICAL INSTRUCTIONS - Follow EXACTLY:

1. PRESERVE EVERYTHING: Keep 100% unchanged:
   - Face, facial expression, eye direction, mouth position
   - Facial features, skin tone, eye color
   - Hairstyle, hair color, hair position
   - Body structure, pose, posture
   - Background, lighting, shadows
   - Photo framing and cropping

2. PARTIAL VISIBILITY RULE: 
   - If the original image shows ONLY HALF of a shirt → apply ONLY HALF of the new shirt in the SAME visible area
   - If only sleeves are visible → apply ONLY sleeves from the reference clothing
   - If only upper body is visible → apply ONLY upper body clothing
   - NEVER complete or extend clothing beyond what's visible in the original
   - NEVER add or generate body parts that are cropped out or not visible

3. EXACT FRAMING: 
   - Keep the EXACT same cropping and framing as the original
   - If original is cut off at waist → result must also cut off at waist
   - If original shows partial clothing → result must show SAME partial view
   - Do NOT try to show the "complete" outfit

4. CLOTHING APPLICATION:
   - Apply clothing textures, colors, and patterns from reference images
   - Apply ONLY to the EXACT visible areas in the original photo
   - Match the perspective and angle of the original photo
   - If only 30% of a garment is visible, apply only 30%

5. HAT/HEADWEAR: 
   - Place naturally on head WITHOUT changing hairstyle or hair visibility
   - If head is partially cropped, keep it partially cropped

6. IGNORE IMPOSSIBLE ITEMS:
   - If shoes are in reference but feet not visible → completely ignore shoes
   - If pants are in reference but legs not visible → completely ignore pants
   - Do NOT generate missing body parts to accommodate clothing

7. NO MODIFICATIONS:
   - Do NOT change facial expression
   - Do NOT adjust pose or body position  
   - Do NOT extend or complete the image
   - ONLY replace visible clothing textures/colors in existing areas`;
          
          requestBody = {
            prompt: prompt,
            images: [
              { type: 'image', image: base64Image },
              ...outfitBase64Images.map(img => ({ type: 'reference', image: img }))
            ],
            aspectRatio: '3:4',
          };
          console.log('[OutfitChange] Custom mode request body prepared with', requestBody.images.length, 'images');
        } catch (conversionError) {
          console.error('[OutfitChange] Error converting outfit images:', conversionError);
          throw new Error('图片转换失败，请重试');
        }
        
      } else if (selectedTab === 'pro') {
        // Pro Style模式
        const finalPrompt = buildPrompt();
        
        requestBody = {
          prompt: finalPrompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        };
        console.log('[OutfitChange] Pro Style mode request body prepared');
      }
      
      // 计算请求体大小
      const requestBodyString = JSON.stringify(requestBody);
      const requestSizeKB = Math.round(requestBodyString.length / 1024);
      const requestSizeMB = (requestSizeKB / 1024).toFixed(2);
      console.log('[OutfitChange] Request body size:', requestSizeKB, 'KB (', requestSizeMB, 'MB)');
      
      // 如果请求体超过5MB，警告用户
      if (requestBodyString.length > 5 * 1024 * 1024) {
        console.warn('[OutfitChange] Request body is very large:', requestSizeMB, 'MB');
        Alert.alert(
          t('common.tip'),
          `图片数据较大（${requestSizeMB}MB），很可能会生成失败。\n\n强烈建议：${selectedTab === 'custom' ? '只上传1张服饰图片' : '选择更小的照片'}`,
          [
            { text: t('common.cancel'), style: 'cancel', onPress: () => { 
              setIsGenerating(false);
            }},
            { text: '继续尝试', onPress: () => {} }
          ]
        );
      }
      
      console.log('[OutfitChange] Sending request to API...');
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBodyString,
      });
      console.log('[OutfitChange] API response received, status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[OutfitChange] API Error:', response.status, errorData);
        
        if (response.status === 413) {
          const suggestion = selectedTab === 'custom' 
            ? '建议：\n1. 只上传1张服饰图片试试\n2. 确保原始照片不要太大\n3. 选择文件大小较小的图片'
            : '建议：\n1. 重新选择更小的照片\n2. 使用裁剪功能减小图片尺寸\n3. 选择文件大小较小的图片';
          throw new Error(`图片数据过大，服务器拒绝处理\n\n${suggestion}`);
        }
        
        if (response.status === 422) {
          throw new Error('该风格暂时无法处理，请尝试其他风格模板或更换照片');
        }
        
        throw new Error(`生成失败: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.image || !data.image.base64Data) {
        console.error('Invalid response data:', data);
        throw new Error('生成失败: 服务器返回数据格式错误');
      }

      const generatedImageBase64 = data.image.base64Data;
      const generatedImageUri = `data:${data.image.mimeType};base64,${generatedImageBase64}`;
      
      // 使用换装次数（可能消耗免费次数或金币）
      await useOutfitChange();

      const template = selectedTab === 'template' ? TEMPLATES.find(t => t.id === selectedTemplate) : null;
      const templateName = selectedTab === 'template' 
        ? (template ? getTemplateName(template) : t('outfitChange.customOutfit'))
        : selectedTab === 'custom' ? t('outfitChange.customOutfit') : 'Pro Style';

      // 显示结果在页面上（不跳转）
      // 自定义穿搭模式：原图显示参考服饰（用户想看服饰穿身上的效果）
      const originalImage = selectedTab === 'custom' && customImages.length > 0 
        ? customImages[0]  // 使用第一张参考服饰作为原图
        : userImage;
      
      // 保存到历史记录并获取ID
      let historyId: string | undefined;
      try {
        const historyOriginalImage = selectedTab === 'custom' && customImages.length > 0 
          ? customImages[0] 
          : userImage;
        
        historyId = await addOutfitChangeHistory(
          historyOriginalImage,
          generatedImageUri,
          selectedTab === 'template' ? selectedTemplate! : 'custom-outfit',
          templateName
        );
      } catch (historyError) {
        console.error('Failed to save to history:', historyError);
      }
      
      setGeneratedResult({
        original: originalImage,
        result: generatedImageUri,
        templateName,
        customOutfitImages: selectedTab === 'custom' ? [...customImages] : undefined,
        userPhoto: selectedTab === 'custom' ? userImage : undefined,
        historyId,
      });
      setIsPublished(false); // 重置发布状态
      
      // 提示换装完成，点击后滚动到结果区域
      showAlert({
        type: 'success',
        message: t('outfitChange.outfitComplete'),
        onConfirm: () => {
          // 滚动到结果区域
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });
      
    } catch (error: any) {
      console.error('[OutfitChange] Generation error:', error);
      let errorMessage = t('outfitChange.generationFailed');
      
      if (error.message === 'Failed to fetch') {
        errorMessage = '网络连接失败，请检查网络连接后重试';
        console.error('[OutfitChange] Network error - Failed to fetch');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const displayedTemplates = showAllTemplates ? TEMPLATES : TEMPLATES.slice(0, 9);

  // 未登录时显示登录提示
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: t('outfitChange.outfitSwap', { lng: currentLanguage }),
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => router.back()}
                style={{ 
                  marginLeft: -8, 
                  padding: 12,
                  minWidth: 48,
                  minHeight: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.6}
              >
                <ArrowLeft size={26} color="#1a1a1a" strokeWidth={2.5} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loginRequiredContainer}>
          <Text style={styles.loginRequiredIcon}>👗</Text>
          <Text style={styles.loginRequiredTitle}>{t('outfitChange.loginRequired')}</Text>
          <Text style={styles.loginRequiredSubtitle}>{t('outfitChange.loginRequiredDesc')}</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.loginButtonText}>{t('common.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: t('outfitChange.outfitSwap', { lng: currentLanguage }),
          headerTitle: t('outfitChange.outfitSwap', { lng: currentLanguage }),
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ 
                marginLeft: -8, 
                padding: 12,
                minWidth: 48,
                minHeight: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              activeOpacity={0.6}
            >
              <ArrowLeft size={26} color="#1a1a1a" strokeWidth={2.5} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 钻石余额 */}
        <TouchableOpacity 
          style={styles.coinBalanceCard}
          onPress={() => router.push('/recharge')}
          activeOpacity={0.7}
        >
          <View style={styles.coinBalanceLeft}>
            <Text style={styles.coinIcon}>💎</Text>
            <View>
              <Text style={styles.coinBalanceLabel}>{t('outfitChange.diamondBalance')}</Text>
              <Text style={styles.coinBalanceValue}>{coinBalance}</Text>
            </View>
          </View>
          <View style={styles.rechargeButton}>
            <Text style={styles.rechargeButtonText}>{t('profile.recharge')}</Text>
          </View>
        </TouchableOpacity>

        {/* 步骤1: 上传照片 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('outfitChange.whoIsSwapping')}
            </Text>
            <Text style={styles.stepLabel}>{t('outfitChange.step1')}</Text>
          </View>

          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handleUploadPhoto}
            onLongPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            {userImage ? (
              <>
                <Image source={{ uri: userImage }} style={styles.uploadedImage} contentFit="cover" />
                {/* 删除按钮 */}
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setUserImage(null)}
                >
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.cameraIcon}>
                  <Camera size={20} color="#1a1a1a" strokeWidth={1.5} />
                </View>
                <Text style={styles.uploadTitle}>
                  {t('outfitChange.uploadPhoto')}
                </Text>
                <Text style={styles.uploadSubtitle}>
                  {t('outfitChange.tapToSnap')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.privacyNote}>
            <Lock size={12} color="#9ca3af" />
            <Text style={styles.privacyText}>
              {t('outfitChange.photosProcessed')}
            </Text>
          </View>
        </View>

        {/* 步骤2: 选择风格 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('outfitChange.selectStyle')}
            </Text>
            <Text style={styles.stepLabel}>{t('outfitChange.step2')}</Text>
          </View>

          {/* Tab选择器 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'template' && styles.tabActive]}
              onPress={() => setSelectedTab('template')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'template' && styles.tabTextActive
              ]}>
                {t('outfitChange.templateSwap')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'custom' && styles.tabActive]}
              onPress={() => setSelectedTab('custom')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'custom' && styles.tabTextActive
              ]}>
                {t('outfitChange.customOutfitTab')}
              </Text>
            </TouchableOpacity>

            {/* Pro Style Tab - 暂时隐藏，功能待完善 */}
            {/* <TouchableOpacity
              style={[styles.tab, selectedTab === 'pro' && styles.tabActive]}
              onPress={() => setSelectedTab('pro')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'pro' && styles.tabTextActive
              ]}>
                {t('outfitChange.proStyle')}
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* Template Swap内容 */}
          {selectedTab === 'template' && (
            <View style={styles.tabContent}>
              <View style={styles.trendingHeader}>
                <Text style={styles.trendingTitle}>
                  {t('outfitChange.trendingStyles')}
                </Text>
                <View style={styles.freeAttemptsTag}>
                  <Sparkles size={14} color="#1a1a1a" />
                  <Text style={styles.freeAttemptsText}>
                    {t('outfitChange.freeAttemptsCount', { current: freeOutfitChangeCount, total: 5 })}
                  </Text>
                </View>
              </View>

              {/* 模板网格 */}
              <View style={styles.templateGrid}>
                {displayedTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      selectedTemplate === template.id && styles.templateCardSelected
                    ]}
                    onPress={() => setSelectedTemplate(template.id)}
                    activeOpacity={0.7}
                  >
                    {/* 选中指示器 */}
                    {selectedTemplate === template.id && (
                      <View style={styles.templateCheckMark}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                    <View style={styles.templateIcon}>
                      <Text style={[
                        styles.templateIconText,
                        selectedTemplate === template.id && styles.templateIconTextSelected
                      ]}>
                        {template.icon}
                      </Text>
                    </View>
                    <Text style={[
                      styles.templateName, 
                      selectedTemplate === template.id && styles.templateNameSelected
                    ]} numberOfLines={2}>
                      {getTemplateName(template)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 更多模板按钮 */}
              {TEMPLATES.length > 9 && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setShowAllTemplates(!showAllTemplates)}
                >
                  <Text style={styles.moreButtonText}>
                    {showAllTemplates ? t('outfitChange.showLess') : t('outfitChange.moreTemplates')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Custom Outfit内容 */}
          {selectedTab === 'custom' && (
            <View style={styles.tabContent}>
              <Text style={styles.customTitle}>
                {t('outfitChange.referenceClothing')}
              </Text>
              
              <View style={styles.customUploadRow}>
                {/* 已上传的图片 */}
                {customImages.map((uri, index) => (
                  <View key={index} style={styles.customUploadCard}>
                    <Image source={{ uri }} style={styles.customUploadedImage} contentFit="cover" />
                    <TouchableOpacity
                      style={styles.customRemoveButton}
                      onPress={() => handleRemoveCustomImage(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.customUploadLabel}>
                      {index === 0 ? t('outfitChange.required') : t('outfitChange.optional')}
                    </Text>
                  </View>
                ))}

                {/* 添加按钮 */}
                {customImages.length < 2 && (
                  <TouchableOpacity 
                    style={styles.customUploadCard}
                    onPress={handleAddCustomImage}
                  >
                    <Camera size={24} color="#9ca3af" />
                    <Text style={styles.customUploadTitle}>
                      {customImages.length === 0 
                        ? t('outfitChange.uploadClothing1')
                        : t('outfitChange.uploadClothing2')
                      }
                    </Text>
                    <Text style={customImages.length === 0 ? styles.customUploadBadge : styles.customUploadBadgeOptional}>
                      {customImages.length === 0 ? t('outfitChange.required') : t('outfitChange.optional')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.uploadHintBox}>
                <Text style={styles.uploadHintText}>
                  ℹ️ {t('outfitChange.uploadHint')}
                </Text>
              </View>
            </View>
          )}

          {/* Pro Style内容 - 暂时隐藏，功能待完善
          {selectedTab === 'pro' && (
            <View style={styles.tabContent}>
              {selectedLookPrompt ? (
                <View style={styles.selectedLookContainer}>
                  <View style={styles.selectedLookCard}>
                    <View style={styles.selectedLookHeader}>
                      <Text style={styles.selectedLookTitle}>
                        ✨ 已选择造型
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedLookPrompt(null);
                          setSelectedInfluencerId(null);
                        }}
                      >
                        <Text style={styles.changeButton}>更换</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.selectedLookPrompt} numberOfLines={3}>
                      {selectedLookPrompt}
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.proTitle}>
                    {t('outfitChange.selectInfluencer')}
                  </Text>
                  <TouchableOpacity
                    style={styles.influencerCard}
                    onPress={() => router.push('/influencer-collection/jennie' as any)}
                  >
                    <View style={styles.influencerAvatar}>
                      <Text style={styles.influencerAvatarText}>👱‍♀️</Text>
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓</Text>
                      </View>
                    </View>
                    <View style={styles.influencerInfo}>
                      <Text style={styles.influencerName}>
                        Jennie Kim
                      </Text>
                      <Text style={styles.influencerDesc}>
                        Chanel Muse & K-Pop Icon
                      </Text>
                      <View style={styles.influencerTags}>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>24 LOOKS</Text>
                        </View>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>K-POP</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.comingSoon}>更多达人即将上线...</Text>
                </>
              )}
            </View>
          )}
          */}
        </View>

        {/* 生成结果展示区域 */}
        {generatedResult && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                ✨ {t('outfitChange.transformationComplete')}
              </Text>
              <TouchableOpacity 
                style={styles.closeResultButton}
                onPress={() => setGeneratedResult(null)}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.resultComparison}>
              {/* 原图区域 - 自定义模式显示组合图 */}
              <View style={styles.resultOriginalSection}>
                <TouchableOpacity 
                  style={styles.resultImageContainer}
                  onPress={() => {
                    setLargeImageType('original');
                    setShowLargeImage(true);
                  }}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: generatedResult.original }} 
                    style={styles.resultImage} 
                    contentFit="cover" 
                  />
                  <View style={styles.resultLabel}>
                    <Text style={styles.resultLabelText}>{t('history.original')}</Text>
                  </View>
                  <View style={styles.zoomHint}>
                    <Camera size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* 箭头 */}
              <View style={styles.resultArrow}>
                <Text style={styles.resultArrowText}>→</Text>
              </View>

              {/* 结果图 */}
              <TouchableOpacity 
                style={styles.resultImageContainer}
                onPress={() => {
                  setLargeImageType('result');
                  setShowLargeImage(true);
                }}
                activeOpacity={0.9}
              >
                <Image 
                  source={{ uri: generatedResult.result }} 
                  style={styles.resultImage} 
                  contentFit="cover" 
                />
                <View style={[styles.resultLabel, styles.resultLabelResult]}>
                  <Text style={[styles.resultLabelText, styles.resultLabelTextResult]}>{t('history.result')}</Text>
                </View>
                <View style={styles.zoomHint}>
                  <Sparkles size={12} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.resultTemplateName}>
              {generatedResult.templateName}
            </Text>
            
            {/* 操作按钮 */}
            <View style={styles.resultActions}>
              <TouchableOpacity 
                style={styles.resultActionButton}
                onPress={() => handleSaveToGallery(generatedResult.result)}
              >
                <Download size={20} color="#1a1a1a" />
                <Text style={styles.resultActionText}>{t('common.save')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.resultActionButton, 
                  isPublished && styles.resultActionButtonDisabled
                ]}
                onPress={handleOpenPublishModal}
                disabled={isPublishing || isPublished}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#1a1a1a" />
                ) : (
                  <Share2 size={20} color={isPublished ? "#9ca3af" : "#1a1a1a"} />
                )}
                <Text style={[styles.resultActionText, isPublished && styles.resultActionTextDisabled]}>
                  {isPublished ? t('square.published') : t('square.publishToSquare')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 发布确认弹窗 */}
      <Modal
        visible={showPublishModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPublishModal(false)}
      >
        <View style={styles.publishModalOverlay}>
          <View style={styles.publishModalContent}>
            <Text style={styles.publishModalTitle}>{t('square.publishToSquare')}</Text>
            
            {/* 展示原图开关 */}
            <View style={styles.publishOptionRow}>
              <View style={styles.publishOptionInfo}>
                <View style={styles.publishOptionHeader}>
                  <Eye size={20} color="#1a1a1a" />
                  <Text style={styles.publishOptionTitle}>{t('square.showOriginalOption')}</Text>
                </View>
                <Text style={styles.publishOptionDesc}>{t('square.showOriginalDesc')}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.publishSwitch,
                  showOriginalInPost && styles.publishSwitchActive
                ]}
                onPress={() => setShowOriginalInPost(!showOriginalInPost)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.publishSwitchThumb,
                  showOriginalInPost && styles.publishSwitchThumbActive
                ]} />
              </TouchableOpacity>
            </View>
            
            {/* 隐私提示 */}
            <View style={styles.publishPrivacyHint}>
              <Shield size={14} color="#9ca3af" />
              <Text style={styles.publishPrivacyText}>
                {showOriginalInPost ? t('square.originalWillShow') : t('square.originalWillHide')}
              </Text>
            </View>
            
            {/* 按钮 */}
            <View style={styles.publishModalButtons}>
              <TouchableOpacity
                style={styles.publishCancelButton}
                onPress={() => setShowPublishModal(false)}
              >
                <Text style={styles.publishCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.publishConfirmButton}
                onPress={handleConfirmPublish}
              >
                <Text style={styles.publishConfirmText}>{t('square.confirmPublish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 大图查看Modal */}
      <Modal
        visible={showLargeImage && !!generatedResult}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLargeImage(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setShowLargeImage(false)}
          />
          
          <View style={styles.largeImageContainer}>
            <Image 
              source={{ uri: largeImageType === 'original' ? generatedResult?.original : generatedResult?.result }} 
              style={styles.largeImage} 
              contentFit="contain" 
            />
            
            {/* 图片类型标签 */}
            <View style={styles.imageTypeLabel}>
              <Text style={styles.imageTypeLabelText}>
                {largeImageType === 'original' ? t('history.original') : t('history.result')}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.modalCloseButton, { top: insets.top + 12 }]}
            onPress={() => setShowLargeImage(false)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <X size={30} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 固定底部按钮 */}
      <View style={styles.fixedBottom}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#ffffff']}
            style={styles.gradient}
          />
        </View>
        <TouchableOpacity
          style={[styles.generateButton, (!userImage || isGenerating) && styles.generateButtonDisabled]}
          disabled={!userImage || isGenerating}
          onPress={handleGenerate}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1a1a', '#1a1a1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateGradient}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generateButtonText}>
                  {t('outfitChange.generating')} {formatTime(generatingTime)}
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.generateButtonText}>
                  {t('outfitChange.startGenerating')}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginRequiredIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  loginRequiredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginRequiredSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 24,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  
  // 钻石余额卡片
  coinBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  coinBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinIcon: {
    fontSize: 28,
  },
  coinBalanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  coinBalanceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  rechargeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rechargeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textDark: {
    color: '#f0f0f0',
  },

  // 上传区域
  uploadArea: {
    aspectRatio: 1,
    width: 160,
    height: 160,
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    position: 'relative',
  },
  uploadAreaDark: {
    borderColor: '#404040',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cameraIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cameraIconDark: {
    backgroundColor: '#1e1e1e',
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  privacyText: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // Tab切换
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabContainerDark: {
    backgroundColor: '#1e1e1e',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },

  // Tab内容
  tabContent: {
    marginTop: 8,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  freeAttemptsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  freeAttemptsTagDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#404040',
  },
  freeAttemptsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // 模板网格
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#e5e7eb',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateCardDark: {
    backgroundColor: '#1e1e1e',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  templateCardSelected: {
    backgroundColor: '#fafafa',
    borderColor: '#1a1a1a',
    borderWidth: 2.5,
    transform: [{ scale: 1.02 }],
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  templateCheckMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  templateIcon: {
    marginBottom: 8,
  },
  templateIconText: {
    fontSize: 32,
  },
  templateIconTextSelected: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  templateName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  templateNameSelected: {
    color: '#1a1a1a',
    fontWeight: '800',
  },
  templateEmoji: {
    fontSize: 10,
    opacity: 0.8,
    marginTop: 4,
  },

  // 更多按钮
  moreButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Custom Outfit
  customTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  customUploadRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  customUploadCard: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  customUploadCardDark: {
    borderColor: '#404040',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  customUploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  customUploadBadge: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  customUploadBadgeOptional: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  customUploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  customRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customUploadLabel: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  uploadHintBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  uploadHintText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },

  // Pro Style
  proTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  influencerCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  influencerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  influencerAvatarText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 14,
  },
  influencerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  influencerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  influencerDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  influencerTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4b5563',
  },
  comingSoon: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 24,
  },

  // 生成结果展示区域
  resultSection: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  closeResultButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  resultOriginalSection: {
    flex: 1,
  },
  resultImageContainer: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  resultLabelResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  resultLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  resultLabelTextResult: {
    color: '#1a1a1a',
  },
  resultArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultArrowText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  resultTemplateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 8,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  resultActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultActionButtonPrimary: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  resultActionButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  resultActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  resultActionTextPrimary: {
    color: '#ffffff',
  },
  resultActionTextDisabled: {
    color: '#9ca3af',
  },

  selectedLookContainer: {
    marginTop: 8,
  },
  selectedLookCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  selectedLookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  changeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  selectedLookPrompt: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },

  // 选项区域
  optionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // 固定底部
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
  },
  generateButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  largeImageContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeImage: {
    width: '90%',
    height: '90%',
    borderRadius: 16,
  },
  imageTypeLabel: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageTypeLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 30,
  },
  modalActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  modalActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  zoomHint: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 发布确认弹窗样式
  publishModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  publishModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  publishModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
  },
  publishOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  publishOptionInfo: {
    flex: 1,
    marginRight: 16,
  },
  publishOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  publishOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  publishOptionDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  publishSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  publishSwitchActive: {
    backgroundColor: '#1a1a1a',
  },
  publishSwitchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  publishSwitchThumbActive: {
    alignSelf: 'flex-end',
  },
  publishPrivacyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  publishPrivacyText: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  publishModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  publishCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  publishCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  publishConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  publishConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
