const AppError = require('../utils/AppError');

// These are highly exclusive, seasonal flagship events that rarely appear on standard public APIs.
// We curate them here so students never miss out on top-tier opportunities.
const FLAGSHIP_EVENTS = [
  {
    id: 'premium_amazon_summer',
    title: 'Amazon ML Summer School',
    organization: 'Amazon',
    type: 'INTERNSHIP',
    location: 'Remote / Virtual',
    url: 'https://amazonmlsummerschoolindia.splashthat.com/',
    deadline: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    source: 'Curated Exclusive',
    featured: true
  },
  {
    id: 'premium_myntra_hacker',
    title: 'Myntra HackerRamp: WeForWomen',
    organization: 'Myntra',
    type: 'HACKATHON',
    location: 'Bangalore / Remote',
    url: 'https://unstop.com/hackathons/myntra-hackerramp',
    deadline: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000),
    source: 'Curated Exclusive',
    featured: true
  },
  {
    id: 'premium_sap_hack2build',
    title: 'SAP Hack2Build',
    organization: 'SAP',
    type: 'HACKATHON',
    location: 'Global Virtual',
    url: 'https://events.sap.com/hack2build/en/home',
    deadline: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
    source: 'Curated Exclusive',
    featured: true
  },
  {
    id: 'premium_shecodes',
    title: 'SheCodes Foundation Global Program',
    organization: 'SheCodes',
    type: 'PLACEMENT',
    location: 'Online',
    url: 'https://www.shecodes.io/foundation',
    deadline: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000),
    source: 'Curated Exclusive',
    featured: true
  },
  {
    id: 'premium_gsoc',
    title: 'Google Summer of Code (GSoC)',
    organization: 'Google',
    type: 'INTERNSHIP',
    location: 'Remote',
    url: 'https://summerofcode.withgoogle.com/',
    deadline: new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000),
    source: 'Curated Exclusive',
    featured: true
  }
];

exports.getExternalOpportunities = async (req, res) => {
  try {
    // Fetch from all available free APIs concurrently
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
    const [jobsResponse, hackathonsResponse, arbeitnowResponse, remotiveResponse, hackClubResponse, unstopResponse] = await Promise.all([
      fetch('https://jobicy.com/api/v2/remote-jobs?count=50').catch(() => null),
      fetch('https://devpost.com/api/hackathons?status=open').catch(() => null),
      fetch('https://www.arbeitnow.com/api/job-board-api').catch(() => null),
      fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=50').catch(() => null),
      fetch('https://hackathons.hackclub.com/api/events/all').catch(() => null),
      fetch('https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons', { headers }).catch(() => null)
    ]);

    let aggregatedData = [];

    // Parse Jobicy
    if (jobsResponse && jobsResponse.ok) {
      const data = await jobsResponse.json();
      const liveJobs = data.jobs.map((job) => {
        const titleLower = job.jobTitle.toLowerCase();
        const isInternship = titleLower.includes('intern') || titleLower.includes('student');
        return {
          id: `jobicy_${job.id}`,
          title: job.jobTitle,
          organization: job.companyName,
          type: isInternship ? 'INTERNSHIP' : 'PLACEMENT',
          location: job.jobGeo || 'Remote',
          url: job.url,
          deadline: new Date(new Date(job.pubDate).getTime() + 30 * 24 * 60 * 60 * 1000), 
          source: 'Jobicy'
        };
      });
      aggregatedData = [...aggregatedData, ...liveJobs];
    }

    // Parse Devpost
    if (hackathonsResponse && hackathonsResponse.ok) {
      const data = await hackathonsResponse.json();
      const liveHackathons = (data.hackathons || []).map((hackathon) => {
        return {
          id: `devpost_${hackathon.id}`,
          title: hackathon.title,
          organization: hackathon.organization_name || 'Devpost Community',
          type: 'HACKATHON',
          location: hackathon.displayed_location ? hackathon.displayed_location.location : 'Online',
          url: hackathon.url,
          deadline: new Date(hackathon.submission_period_dates ? hackathon.submission_period_dates.split(' - ')[1] || new Date() : new Date()),
          source: 'Devpost'
        };
      });
      aggregatedData = [...aggregatedData, ...liveHackathons];
    }

    // Parse Arbeitnow
    if (arbeitnowResponse && arbeitnowResponse.ok) {
      const data = await arbeitnowResponse.json();
      const arbeitnowJobs = (data.data || []).slice(0, 50).map((job) => {
        const titleLower = job.title.toLowerCase();
        const isInternship = titleLower.includes('intern') || titleLower.includes('student') || titleLower.includes('working student');
        return {
          id: `arbeitnow_${job.slug}`,
          title: job.title,
          organization: job.company_name,
          type: isInternship ? 'INTERNSHIP' : 'PLACEMENT',
          location: job.location + (job.remote ? ' (Remote)' : ''),
          url: job.url,
          deadline: new Date(new Date(job.created_at * 1000).getTime() + 30 * 24 * 60 * 60 * 1000),
          source: 'Arbeitnow'
        };
      });
      aggregatedData = [...aggregatedData, ...arbeitnowJobs];
    }

    // Parse Remotive
    if (remotiveResponse && remotiveResponse.ok) {
      const data = await remotiveResponse.json();
      const remotiveJobs = (data.jobs || []).map((job) => {
        const titleLower = job.title.toLowerCase();
        const isInternship = titleLower.includes('intern') || titleLower.includes('student');
        return {
          id: `remotive_${job.id}`,
          title: job.title,
          organization: job.company_name,
          type: isInternship ? 'INTERNSHIP' : 'PLACEMENT',
          location: job.candidate_required_location || 'Remote',
          url: job.url,
          deadline: new Date(new Date(job.publication_date).getTime() + 30 * 24 * 60 * 60 * 1000),
          source: 'Remotive'
        };
      });
      aggregatedData = [...aggregatedData, ...remotiveJobs];
    }

    // Parse Hack Club
    if (hackClubResponse && hackClubResponse.ok) {
      const data = await hackClubResponse.json();
      const liveHackClub = (data || []).map((event) => {
        return {
          id: `hackclub_${event.id}`,
          title: event.name,
          organization: 'Hack Club Network',
          type: 'HACKATHON',
          location: event.virtual ? 'Online' : (event.city ? `${event.city}, ${event.country}` : 'In-Person'),
          url: event.website,
          deadline: new Date(event.start || new Date()),
          source: 'Hack Club'
        };
      });
      aggregatedData = [...aggregatedData, ...liveHackClub];
    }

    // Parse Unstop
    if (unstopResponse && unstopResponse.ok) {
      const json = await unstopResponse.json();
      const unstopData = json?.data?.data || [];
      const liveUnstop = unstopData.map((opp) => {
        return {
          id: `unstop_${opp.id}`,
          title: opp.title,
          organization: opp.organisation?.name || 'Unstop',
          type: 'HACKATHON',
          location: 'Remote / India',
          url: opp.seo_url || `https://unstop.com/o/${opp.short_url}`,
          deadline: new Date(opp.regnRequirements?.end_regn_dt || opp.end_date || new Date()),
          source: 'Unstop'
        };
      });
      aggregatedData = [...aggregatedData, ...liveUnstop];
    }

    // Remove duplicates based on lowercased "title + organization"
    const uniqueMap = new Map();
    aggregatedData.forEach(opp => {
      const key = `${opp.title.toLowerCase().trim()}|${opp.organization.toLowerCase().trim()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, opp);
      }
    });

    const uniqueOpportunities = Array.from(uniqueMap.values());

    // Shuffle the API array to naturally mix the results
    let shuffledData = uniqueOpportunities.sort(() => Math.random() - 0.5);

    // Unshift the Premium Curated Flagship events to the very top!
    shuffledData = [...FLAGSHIP_EVENTS, ...shuffledData];

    res.status(200).json({
      success: true,
      meta: {
        totalFound: aggregatedData.length,
        totalUnique: uniqueOpportunities.length
      },
      data: shuffledData
    });

  } catch (error) {
    console.error('Error fetching live opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external opportunities'
    });
  }
};
