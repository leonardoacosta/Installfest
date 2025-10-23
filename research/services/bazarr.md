# Bazarr - Service Synergy Analysis

## Service Overview
Bazarr is a companion application to Sonarr and Radarr that manages and downloads subtitles based on defined requirements, ensuring all media has appropriate subtitle tracks.

## Synergies with Other Services

### Strong Integrations
1. **Radarr**: Automatic movie subtitle fetching
2. **Sonarr**: TV episode subtitle downloading
3. **Jellyfin**: Subtitle delivery for streaming
4. **Prowlarr**: Subtitle indexer searches
5. **Home Assistant**: Subtitle automation and monitoring
6. **Gluetun**: VPN protection for subtitle sites
7. **Byparr**: Cloudflare bypass for protected sites

### Complementary Services
- **Ollama**: Subtitle translation and quality check
- **Glance**: Subtitle statistics dashboard
- **Samba**: Direct subtitle file access
- **Nginx Proxy Manager**: Secure management access
- **Tailscale**: Remote subtitle management
- **Lidarr**: Lyrics as subtitle files

## Redundancies
- **Built-in Jellyfin Subtitles**: Basic subtitle search
- **Manual Subtitle Sites**: Direct downloading
- **Subtitle Edit**: Manual timing tools
- **OpenSubtitles Plugin**: Individual service plugins

## Recommended Additional Services

### High Priority
1. **Subliminal**: Alternative subtitle downloader
2. **Subtitle Edit**: Manual subtitle adjustment
3. **Addic7ed**: Additional subtitle source
4. **Podnapisi**: European subtitle focus
5. **Subscene**: Large subtitle database

### Medium Priority
1. **OpenSubtitles VIP**: Premium features
2. **SubSync**: Automatic synchronization
3. **AutoSub**: Speech recognition subs
4. **Whisper AI**: Generate missing subtitles
5. **DeepL**: Translation services

### Low Priority
1. **YIFY Subtitles**: Movie focus
2. **TVSubtitles**: TV show specific
3. **Subdivx**: Spanish subtitles
4. **Napiprojekt**: Polish subtitles
5. **Legendas.tv**: Portuguese subtitles

## Integration Opportunities

### Subtitle Pipeline
```mermaid
graph LR
    Media[Media Import] --> Scan[Bazarr Scan]
    Scan --> Search[Provider Search]
    Search --> Score[Quality Scoring]
    Score --> Download[Best Match]
    Download --> Sync[Sync Check]
    Sync --> Embed[Optional Embed]
    Embed --> Ready[Media Ready]
```

### Provider Strategy
1. **Tiered Providers**:
   - Tier 1: OpenSubtitles, Addic7ed
   - Tier 2: Podnapisi, Subscene
   - Tier 3: YIFY, TVSubtitles

2. **Language Priority**:
   - Primary: Native language
   - Secondary: English
   - Tertiary: Other preferences

3. **Quality Scoring**:
   - Sync match
   - Release group match
   - Hearing impaired tags
   - Language accuracy

## Optimization Recommendations

### Provider Configuration
```yaml
Providers:
  OpenSubtitles:
    - Username: required
    - VIP: optional
    - Trust Score: minimum
  Addic7ed:
    - Username: required
    - Rate Limit: respect
  Podnapisi:
    - No auth needed
    - Good for European
```

### Language Profiles
```yaml
Profiles:
  - English Only:
      Languages: [en]
      Forced: Foreign parts
      HI: Exclude
  - Multilingual:
      Languages: [en, es, fr]
      Forced: Always
      HI: Include option
  - Accessibility:
      Languages: [en]
      Forced: Yes
      HI: Required
```

### Automation Rules
1. **Immediate Search**: On media import
2. **Scheduled Search**: Daily for missing
3. **Upgrade Search**: Better quality available
4. **Manual Search**: User triggered
5. **Blacklist Management**: Failed subtitles

## Service-Specific Features

### Subtitle Types
- **Normal**: Standard dialogue
- **Forced**: Foreign language parts only
- **HI/SDH**: Hearing impaired with sounds
- **Commentary**: Director/actor commentary
- **Lyrics**: Song subtitles for musicals

### Sync Features
1. **Automatic Sync**: Detect and fix timing
2. **Frame Rate**: Convert between formats
3. **Offset Adjustment**: Manual timing fix
4. **Split/Join**: Episode management
5. **Encoding Fix**: Character corrections

### Integration Settings

#### With Radarr/Sonarr
```yaml
Connection:
  - API Key: From *arr service
  - Minimum Score: 90%
  - Excluded Tags: [no-subs]
  - Path Mappings: Docker paths
```

#### With Anti-Captcha
```yaml
Anti-Captcha:
  - Service: Anti-Captcha/2Captcha
  - For: Protected providers
  - Fallback: Manual solve
```

## Advanced Features

### Custom Scripts
1. **Post-Processing**: After download
2. **Translation**: Auto-translate missing
3. **Quality Check**: Verify sync
4. **Embedding**: MKV muxing
5. **Backup**: Archive originals

### AI Integration
```yaml
Whisper Integration:
  - Generate missing subs
  - Improve timing
  - Translation verification
  - Multiple language generation
```

### Quality Management
1. **Score Calculation**:
   - Release match: +50
   - FPS match: +30
   - Trusted user: +20
   - Hearing impaired: ±10

2. **Blacklist Rules**:
   - Wrong language
   - Out of sync > 5 seconds
   - Incomplete subtitles
   - Spam/advertisements

## Performance Optimization

### Search Optimization
1. **Rate Limiting**: Respect provider limits
2. **Caching**: Store search results
3. **Parallel Search**: Multiple providers
4. **Smart Retry**: Exponential backoff
5. **Result Dedup**: Avoid duplicates

### Storage Efficiency
1. **Subtitle Format**: SRT preferred
2. **Compression**: Store zipped
3. **Cleanup**: Remove upgraded versions
4. **Backup**: Keep originals
5. **Embedding**: Optional MKV mux

## Integration Patterns

### Media Workflow
```yaml
Workflow:
  1. Media downloaded by Radarr/Sonarr
  2. Bazarr notified via webhook
  3. Search providers for subtitles
  4. Score and select best match
  5. Download and verify sync
  6. Optional: Embed in MKV
  7. Notify completion
```

### Accessibility Focus
1. **SDH Priority**: For hearing impaired
2. **Multiple Languages**: Family needs
3. **Forced Subtitles**: Foreign parts
4. **Clear Fonts**: Readability
5. **Position Options**: Avoid UI overlap

## Key Findings

### What Needs to Be Done
1. Configure multiple subtitle providers
2. Set up language profiles for users
3. Configure anti-captcha service
4. Set up sync detection
5. Create upgrade schedules

### Why These Changes Are Beneficial
1. Ensures all media has subtitles
2. Improves accessibility for all users
3. Handles foreign language content
4. Automates tedious subtitle hunting
5. Maintains quality standards

### How to Implement
1. Deploy Bazarr container
2. Connect to Radarr and Sonarr
3. Configure subtitle providers
4. Set up language profiles
5. Configure anti-captcha if needed
6. Set minimum score thresholds
7. Enable automatic search
8. Configure upgrade tasks
9. Set up notifications
10. Test with sample media