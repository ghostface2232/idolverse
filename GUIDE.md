# Idolverse Implementation Guide
A K-Pop idol management simulation game. Features Kairosoft-style pixel art visuals and is a mobile-first web app.

---

## Game System Design

### Core Design Philosophy

The fun of this game lies not in simply accumulating numbers, but in making strategic choices amidst trade-offs. Every week, players decide what to give up in order to gain something. Results are determined not by individual member stats, but by the synergy of combinations, chemistry, and concepts. Wrong choices result in tangible losses, and the process of recovering from those losses becomes the game’s narrative.

### Weekly Loop: Core Decision System

Managing every detail manually each week is exhausting, while leaving everything on autopilot is boring. Therefore, the weekly loop operates using a core decision card system.

At the start of each week, the player is presented with 3–4 decision cards. Each card presents a choice between two or three options. Example:

- This Week’s Training Focus: Intensive vocal training / Joint choreography practice / Week dedicated to recovery
- Budget Allocation: Additional investment in new song production / Launch a promotional campaign / Save for later
- Member A’s Schedule: Maintain team practice / Send them to appear on a variety show / Individual vocal lessons
- Emergency Event Response: (Only if triggered) Allocate funds to manage a scandal / Maintain silence / Issue an official statement

The Manager AI automatically handles the remaining details (specific schedules, meal plans, individual training allocations, etc.). The higher the Manager’s stats, the more efficient the automatic allocation.

During Auto-Progress (1x/2x/3x), the process pauses only when an event occurs or an important decision is required.

### Trade-off Pressure Structure

Every choice must involve an opportunity cost:

- Variety Show Appearance -> Training for that member is skipped that week, but it offers an opportunity to increase recognition
- Intensive Training -> Accelerates skill growth, but increases the risk of stress and injury
- Condition Recovery Week -> Increases efficiency the following week, but delays the debut goal by one week
- Vacation -> Significantly restores condition and satisfaction, but increases the probability of a dating scandal
- Promotional budget allocation -> Initial boost in recognition, but reduced funds prevent investment elsewhere
- Hiring external composers -> Improved song quality, but one-time costs + diminished producer pride

### Member Position System

Assign a primary and secondary position to each member:

- Leader: Manages team morale, provides mental support during crises, handles communication with MCs on variety shows
- Main Vocalist: Key contributor to album sound quality; carries significant weight in live performance evaluations
- Main Dancer: Key to choreography execution; carries significant weight in performance scores
- Center: Determines visual exposure frequency; influences first impressions and public appeal; increases the probability of receiving advertising offers
- Visual: Determines the quality of visual content; enhances photo shoots and advertisements
- Variety Specialist: Significantly increases the success rate of variety shows and the likelihood of going viral
- Producing Member: Provides a quality bonus when creating original songs and helps shape the artist’s image within the fandom

Position assignments do not need to match ability scores 100%. You can assign a member with a Vocal score of 70 to the Main Vocal position, but the album quality will be lower than if you assigned a member with a Vocal score of 90. Assigning a member to an unsuitable position increases their dissatisfaction.

The reason positions are important is that you must create a combination capable of covering each role, rather than simply selecting the five members with the highest average stats. You need both a member with 90 in Vocal and 30 in Dance and a member with 30 in Vocal and 90 in Dance to fill the Main Vocalist and Main Dancer roles.

### Member Chemistry System

Each member pair has a chemistry value ranging from -100 to +100.

- Positive Chemistry: Growth bonuses when practicing together, increased group stage performance quality, and popular chemistry content in the fan community.
- Negative Chemistry: Accumulation of conflict, reduced efficiency in group activities, and potential public discord events if left unaddressed.

Chemistry is initially assigned randomly and fluctuates based on time spent together, shared training, and event experiences. While players cannot directly adjust it, they can indirectly manage it by deciding who to train together and who to send off separately.

The team’s overall average chemistry is applied as a modifier to album and stage performances.

### Concept Affinity System

Each member has a hidden concept affinity:

```
Member A: Fresh +80, Dark +20, Retro +50, Cute +90, Girl Crush +10
Member B: Fresh +30, Dark +85, Retro +60, Cute +10, Girl Crush +75
```

Once an album concept is decided, each member’s affinity for that concept affects their efficiency during the album’s promotional period:

- High Affinity: Training absorption rate bonus, improved stage presence, and sustained satisfaction
- Low Affinity: Training absorption rate penalty, awkwardness on stage (performance penalty), and accumulated dissatisfaction

If you keep assigning albums with concepts that don’t suit them, dissatisfaction will build up, eventually putting them at risk of leaving the group.

Concept suitability also applies at the group level. A group with weak vocals taking on a ballad concept carries high risk, while a team with strong performance skills adopting an intense concept creates synergy.

### Concept History and Fan Expectations

The concepts of the albums a group has released so far accumulate as a history. This history shapes the expectations of the fanbase.

- If they’ve pushed a fresh concept three times in a row, the core fandom will expect a fresh concept.
- If they suddenly adopt a dark concept in this state: Risk of core fandom defection + However, public interest may surge with low probability (due to buzz from the transformation)
- Gradual changes (fresh -> city pop -> retro) carry less risk.
- Abrupt changes are high-risk, high-reward.

### 4-Axis Fan/Popularity Separation System

Rather than a single popularity metric, we separate it into four independent indicators:

1. Public Popularity (Public): Sensitive to music charts, variety show appearances, virality, and buzz. Rises and falls easily. Affects music revenue and advertising offers.

2. Core Fandom: Reflected in album sales, merchandise, concert ticket sales, and fan cafe activity. Grows slowly but is solid. However, if disappointment accumulates due to scandals, concept breakdowns, declining performance, or excessive commercial activities, members may leave. The core of album and concert revenue.

3. Global Fandom: Influenced by Spotify, YouTube, and global social media. The cornerstone of overseas expansion. Influences overseas advertising and world tour revenue. Growth is slow with domestic activities alone but accelerates with overseas promotions.

4. Industry Reputation: Influences award show jury scores, collaboration offers, high-profile broadcast opportunities (Netflix, top-tier variety shows), and major brand advertisements. Accumulated through musical quality, stage performance excellence, and consistent activity. Plummets in the event of scandals or a decline in quality.

Since each axis increases or decreases independently, realistic scenarios are reflected, such as groups with high public recognition but a thin core fanbase (strong in digital sales but unable to sell out concerts) or groups with a thick core fanbase but unknown to the general public (albums sell but chart rankings are low).

### Loss and Risk System

Wrong choices result in substantial and long-term losses:

Trainee Departures:
- If dissatisfaction exceeds a threshold, a departure warning is issued -> If ignored, the trainee actually leaves
- Causes of departure: Repeatedly assigned unsuitable concepts, excessive schedules, poor treatment, conflicts with peers, delayed debut
- Member departures after debut cause shock to the core fanbase + damage to the group’s image

Fanbase Departures:
- When core fans’ disappointment accumulates, they leave fan cafes and reduce album purchases
- Triggers: Long hiatuses, drastic concept changes, excessive commercial activities (focusing only on ads and not music), dating scandals, stage accidents
- Churn occurs gradually, and recovery takes much longer than the initial loss

Contract Penalties from Investors:
- Failure to meet conditions results in more than just fines
- IT Companies: Failure to meet digital metrics -> Discontinuation of social media/platform marketing support + refusal of follow-up investment
- Entertainment Companies: Failure to meet stage performance targets -> Disadvantages in broadcast scheduling + Blocked artist collaborations
- VCs: Failure to meet revenue targets -> Management interference (enforcing specific activities), pressure to dilute equity, and in the worst case, notification of investment withdrawal
- Cosmetics Companies: Failure to meet visual/advertising targets -> Cancellation of ads + Liquidated damages + Damage to industry reputation

### Investors = Mechanisms Defining Playstyle

Choosing an investor isn’t just a starting point—it determines the strategic direction of the entire game:

- Investing in an IT company: Strong pressure to meet digital KPIs (streaming, social media, YouTube). Viral/online-focused strategies are advantageous.
- Investing in an entertainment company: Stage performance quality and award show results are key metrics. You must invest in performance training and music quality.
- VC/Fund Investment: Relentlessly focuses on growth rates and ROI. Quarterly revenue reporting events occur. Pressure for rapid monetization.
- Cosmetics Company: Strong emphasis on visuals and advertising appeal. Members with high visual scores are prioritized.
- Fashion Company: Prioritizes style and trend alignment. Provides special events such as attendance at international fashion weeks.

### Seasons and the K-POP Calendar

In-game time follows a 52-week (1-year) cycle:

Spring (Weeks 1–13): High demand for fresh, Y2K, and spring-themed concepts. Rookie debut season.
Summer (Weeks 14–26): Demand for sexy, trendy, and summer song concepts. Music festival season.
Fall (Weeks 27–39): High demand for emotional/lyrical/artistic concepts. Preparation period for award season.
Winter (Weeks 40–52): Christmas/winter concepts. Year-end award season (MMA/MAMA/Golden Disc Awards).

1–2 K-POP news items appear each week:
- “Major agency’s rookie girl group NOVA set to debut next month”
- “Top-tier boy group APEX makes a comeback this week. Pre-release track sweeps the charts”
- “Ratings for male idol survival shows skyrocket”
- “Performance-oriented tracks underperforming this quarter; emotional ballads dominate”

This news is linked to rival groups’ activities and market trends. If a comeback overlaps with a major group’s release, chart competition becomes unfavorable; if it occurs during a quiet week, it offers a relative advantage.

### Competitive Group System

There are two types:

Permanent Competitive Groups (3–5 teams):
- Created at the start of the game; operate on the same timeline as the player
- Simulate debut, comeback, growth, and disbandment using similar rules
- Types:
  - Traditional Major Agency: Strong financial backing and systems. High initial polish. Weakness: Lack of individuality
  - Viral/Character-Based: Strong on social media and variety shows. Weakness: Controversy over musicality
  - Performance Monsters: Unbeatable on stage. Weakness: Weak vocals
  - Overseas-Specialized: Many foreign members. Weakness: Limited domestic activities
  - Survival Show Alumni: Explosive initial buzz. Weakness: Individual fans > group fans

Event-Based Competitive Groups:
- Appear at specific times, creating sudden pressure
- Mega-rookies, chart-topping sensations, seasonal powerhouses, global re-imports
- Provide tension without the burden of constant management

Players can also choose their group’s positioning. Selecting many foreign members leads to an overseas-focused group, while prioritizing members with strong variety show appeal makes the group closer to the Viral/Character type.

### Competitive Market Simulation

Chart rankings are not absolute values but relative evaluations compared to all groups active that week. If there are many simultaneous comebacks, rankings will be lower even with the same quality; coming back during a quiet week is advantageous but may result in lower overall market interest.

### Activities Between Albums (Interlude Period)

- Original Content Production (YouTube, Practice Videos): Maintains fandom, grows overseas fanbase
- Fan Community Management (Fan Cafe Events, Online Fan Meetings): Maintains core fandom loyalty
- Individual Member Schedules (Acting, Modeling, OST): Personal growth + income, reduces time available for the group
- Live Broadcasts: Fan interaction; effectiveness increases if members have variety show talent
- Controversy Management: Ignore/Clarify/Apologize (Each affects the 4 axes differently)
- Vacation: Dramatically restores condition/satisfaction; risk of dating scandals; natural decline in public awareness

### Album Development System (Advanced)

Quality does not improve based on budget alone:

1. Concept: Synergy between genre and atmosphere (S/A/B/C/D)
2. Title track selection: Choose from 2–3 candidates
   - Safe Track: Proven formula, low risk/low return, satisfies existing fanbase
   - Challenging Track: Fresh but risky; generates massive buzz if successful
   - Fan Acquisition Track: Ideal for expanding core fanbase; average mainstream appeal
   - Overseas Target Track: Ideal for growing overseas fanbase; average domestic response
3. Member-Concept Compatibility
4. Alignment with Fanbase Expectations (Concept History Continuity)
5. Seasonal Suitability
6. Market Competition
7. External Collaborations (Quality Boost, Cost + Internal Satisfaction Risk)

### Operating Cost Structure

Fixed Costs (Automatically deducted weekly): Accommodation/rehearsal space/equipment maintenance, staff salaries, living expenses

Upgrades (One-time): Accommodation/rehearsal room/equipment upgrades, filming equipment, healthcare (injury prevention/recovery), security team (scandal prevention)

Consumable Expenses (Optional): Intensive training packages, external choreographers/composers, viral marketing/ad campaigns, fan events, music video production costs by tier

### Game Phases

```
Phase 0: Prologue
  └── Select Investor (= Determine Playstyle) → Group Gender/Name

Phase 1: Founding Period
  └── Hire Staff → Invest in Facilities → Recruit Trainees → Assign Positions

Phase 2: Training Period
  └── Core Decision Cards → Stat Growth → Build Chemistry → Album Development → Select Title Track

Phase 3: Debut/Activity Phase
  └── Showcase → Music Shows → Promotion → Chart Competition → Performance → Interlude

Phase 4: Growth Phase
  └── Repeated Comebacks → Concept History → Ads/Variety Shows/Dramas → 4-Pillar Fandom Growth → Award Ceremonies

Phase 5: Peak Phase
  └── Overseas Expansion → World Tour → Global → Achieving Legend Status
```

### Award Ceremonies

The 3 Major Year-End Award Ceremonies:
- MMA: Digital 60%, Album Sales 10%, Voting 20%, Judging 10%
- MAMA: Digital 30%, Album Sales 20%, Voting 30%, Judging 20%
- Golden Disc Awards: Digital 20%, Album Sales 60%, Voting 10%, Judging 10%

Awards: Rookie Award, Main Award, Grand Prize, Popularity Award.

### Overseas Expansion

Requirements: 1+ domestic Grand Prize win, entry into Spotify Global Charts, 500,000+ overseas fans, 3+ albums released, secured funding.