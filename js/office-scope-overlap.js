// Advisory only: common scope overlaps need a human review, not automatic price deductions.
const sharedWork=[
 ['website','responsive','Website and mobile-responsive design may share front-end implementation.'],
 ['supabase','login','Supabase authentication and user login may share account setup and security work.'],
 ['portal','login','Client portal and login/profile features may share identity and navigation work.'],
 ['crm','pipeline','CRM and sales pipeline often share contact and deal data models.'],
 ['stripe','checkout','Stripe integration and checkout can involve the same payment flow.'],
 ['admin','reporting','Admin dashboard and KPI reporting may reuse charts and permissions.'],
 ['notifications','resend','Notification workflows and Resend transactional email can share delivery logic.'],
 ['newsletter','kit','Newsletter features and Kit email campaigns can share subscriber workflows.'],
 ['newsletter','email_templates','Newsletter delivery and branded email templates may overlap.'],
 ['vercel','monitoring','Hosting setup and monitoring can share deployment configuration.']
];
export function sharedImplementationWarnings(components){
 const keys=new Set(components.map(x=>x.component_key));
 return sharedWork.filter(([a,b])=>keys.has(a)&&keys.has(b)).map(([a,b,message])=>({a,b,message}));
}
