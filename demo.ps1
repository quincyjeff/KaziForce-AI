param([string]$Email = "")
$api = "http://localhost:3000/api"
$stamp = Get-Date -Format "HHmmss"
function Address($label) {
    if ($Email) {
        $name, $domain = $Email.Split("@")
        return "$name+$label$stamp@$domain"
    }
    return "$label$stamp@demo.test"
}

function Send($path, $body, $token = $null) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    Invoke-RestMethod -Method Post -Uri "$api/$path" -ContentType "application/json" -Headers $headers -Body ($body | ConvertTo-Json)
}

function Fetch($path, $token = $null) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    Invoke-RestMethod -Method Get -Uri "$api/$path" -Headers $headers
}

function PatchCall($path, $token = $null) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    Invoke-RestMethod -Method Patch -Uri "$api/$path" -Headers $headers
}

function Step($text) {
    Write-Host ""
    Write-Host "=== $text ===" -ForegroundColor Cyan
}

Step "1. Health check"
Invoke-RestMethod "$api/health" | Format-Table

Step "2. Register an employer and three candidates (with JWT authentication)"
$employer = Send "users/register" @{ name = "Acme Tech"; email = (Address "hr"); password = "demo1234"; role = "employer" }
$javaDev = Send "users/register" @{ name = "Amina Otieno"; email = (Address "amina"); password = "demo1234"; role = "candidate" }
$fullStack = Send "users/register" @{ name = "Brian Mwangi"; email = (Address "brian"); password = "demo1234"; role = "candidate" }
$marketer = Send "users/register" @{ name = "Carol Njeri"; email = (Address "carol"); password = "demo1234"; role = "candidate" }
@($employer, $javaDev, $fullStack, $marketer) | Format-Table user_id, name, role

Step "3. Candidates upload resumes using their JWT tokens"
$javaResume = Send "resumes" @{
    user_id = $javaDev.user_id
    job_role = "Java Backend Developer"
    skills = "Java, Spring Boot, REST API, SQL, Microservices"
    resume_text = "Backend developer with 4 years of experience building Java microservices and REST APIs with Spring Boot and MySQL."
} $javaDev.token
$fullStackResume = Send "resumes" @{
    user_id = $fullStack.user_id
    job_role = "Full Stack Java Developer"
    skills = "Java, Spring Boot, React, SQL, REST API"
    resume_text = "Full stack developer with 3 years of experience building web applications with Java Spring Boot back ends and React front ends."
} $fullStack.token
$marketerResume = Send "resumes" @{
    user_id = $marketer.user_id
    job_role = "Digital Marketing Specialist"
    skills = "SEO, Social Media, Content Marketing, Google Analytics"
    resume_text = "Marketing specialist with 5 years of experience planning social media campaigns, writing content and improving search rankings."
} $marketer.token
@($javaResume, $fullStackResume, $marketerResume) | Format-Table resume_id

Step "4. Employer posts a Senior Java Developer job with JWT token (triggers notifications)"
$job = Send "jobs" @{
    employer_id = $employer.user_id
    job_title = "Senior Java Developer"
    company_name = "Acme Tech"
    location = "Nairobi, Kenya"
    work_type = "Full-time"
    skills = "Java, Spring Boot, SQL"
    job_description = "Design and build Java microservices and REST APIs using Spring Boot. Work with SQL databases and mentor junior developers."
} $employer.token
$job | Format-Table job_id, job_title, candidates_notified, employer_notified

Step "5. Candidate notifications (protected by JWT)"
foreach ($candidate in @($javaDev, $fullStack, $marketer)) {
    Write-Host "$($candidate.name):" -ForegroundColor Yellow
    $result = Fetch "notifications/user/$($candidate.user_id)" $candidate.token
    if ($result.notifications.Count -eq 0) {
        Write-Host "  no notifications (job did not match well enough)"
    } else {
        $result.notifications | Format-Table notification_id, message, is_read -Wrap
    }
}

Step "6. Employer notification (protected by JWT)"
(Fetch "notifications/user/$($employer.user_id)" $employer.token).notifications | Format-Table notification_id, message, is_read -Wrap

Step "7. Top candidates for the job"
Invoke-RestMethod "$api/match/job/$($job.job_id)?top=5" | Format-Table resume_id, job_role, match_score

Step "8. Top jobs for the Java developer's resume"
Invoke-RestMethod "$api/match/resume/$($javaResume.resume_id)?top=5" | Format-Table job_id, job_title, company_name, match_score

Step "9. Candidate marks a notification as read with JWT token"
$first = (Fetch "notifications/user/$($javaDev.user_id)" $javaDev.token).notifications[0]
PatchCall "notifications/$($first.notification_id)/read" $javaDev.token | Format-Table
Write-Host "Unread count now:" (Fetch "notifications/user/$($javaDev.user_id)" $javaDev.token).unread_count

Write-Host ""
Write-Host "Demo complete." -ForegroundColor Green
