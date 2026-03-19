Searches fail to return results after 60-minute AWS login timeout (Fidelity Standards). There is currently no indication on the UI to indicate the disconnect.
So, i am building the ui element which should inform the user during timeout and navigate back to logout page than hanging on discover with no results.

the ui element i want to create is line a toaster on bottom left which should disaply message that session is times out and then the page redirect to next-url (need to see who sends this )(this seesm to be present in getreifect url - src/core/server/http/index.ts) please confirm this

currently the issue is there is not indicator fr cx to know session timeout so on discover if user is present it is currentlky hanged,
we want to show toaster with nformation of timeout and then redirect

there are some suth service already present in backedn from frontend we have to confirm

Here are some code snippets from backend logic please read it and udnersatdn how we can read session timeout and also if there is already service present in out osd which is handling that please check that too

func (a *Authz) HandleAosdRequest(reqCtx context.Context, req requestwrapper.RequestWrapper, res responsewrapper.ResponseWrapper) {
/**
This function needs to be only called by SecurityAgent for Aosd(neo) login flow
either for IAM login or IDC login
**/
reqStats, \_ := reqCtx.Value(define.StatsContextKey).(*authzstats.AuthzStats)
logger, \_ := reqCtx.Value(requestlogger.LoggerContextKey).(\*requestlogger.RequestLogger)

    contextMap := getAosdRequestContext(req)
    PopulateVpceContext(req, contextMap)

    // call this method once Aosd start supporting VPC Endpoint for the customers
    // populateVpceContext(r, contextMap)

    reqStats.BrowserRequests += 1
    authzstats.StatsEmitter.C.Count("requests.browsers", 1, nil, 0.1)

    // The aosd request which reaches here either has IAM credentials or cookie.
    // 1. If IAM credentials, we perform Sigv4 validation using AuthService and get the JWT token
    // 2. If cookie, we need to validate the cookie and generate the JWT token for the aosd service.
    // 3. If no credentials found, then redirect to the IAM console login page for aosd.
    // The audit logging is not supported for neo, so ignore the second return args
    token, _, _, err := a.Authn.GetSecurityToken(reqCtx, req, contextMap, nil)
    reqStats.AuthNTokenRequests += 1
    authzstats.StatsEmitter.C.Count("authn.tokens.requests", 1, nil, 0.1)

    if token == nil {
    	// If the code reaches here, means the request does not contain sigv4 and cookie is
    	// either not present or invalid. In this case we should just return 403 or send to aws
    	// console login page for aosd when present.
    	reqStats.AuthNTokenNotIssued += 1
    	authzstats.StatsEmitter.C.Count("authn.tokens.denied", 1, nil, 0.1)
    	if err.HttpStatus() == http.StatusInternalServerError || err.HttpStatus() == http.StatusTooManyRequests {
    		handleInternalServerError(err, req, res, reqStats, logger)
    		return
    	}

    	// Token not issued for AOSD API request
    	if !IsBrowser(req) {
    		res.SetStatus(reqStats.HttpStatus(err.HttpStatus()))
    		WriteErrorResponse(logger, req, res, err)
    		return
    	}

    	// no valid token
    	logger.Log.Debug("authz failed to get a token for browser request. sending redirect")
    	deleteSessionCookieKey(res, req.GetHost())

    	RedirectAosdDashboardsUser(reqCtx, req, res, a.Authn, req.GetHeader(define.HeaderKeyAmznAccountId), req.GetHeader(define.HeaderKeyAosdAppId), true)
    	return
    }

    // Add customer JWT token to the request to be able to forward to aosd service
    res.SetHeader(define.SecurityTokenHeader, fmt.Sprintf("%s %s", token.Type, token.Value))

    authzstats.StatsEmitter.C.Count("authn.tokens.issued", 1, nil, 0.1)
    // Once JWT token is received from AuthService, we need to forward the token to aosd service.
    res.SetStatus(reqStats.HttpStatus(http.StatusOK))

    logger.Log.Debug("authz sent the token to envoy")

}

if token == nil -> redirect user to aws console to get iam credentials. -

n this case, redirect user to login page for aosd.
This could be Login page once IDC is onboarded for aosd customer in Unified Infra.
If not, then we can redirect user to IAM console login page.
*/
func RedirectAosdDashboardsUser(reqCtx context.Context, req requestwrapper.RequestWrapper, res responsewrapper.ResponseWrapper, provider authnservice.AuthNServiceProvider, accId string, appId string,
redirectToDashboardURL bool) {
reqStats, \_ := reqCtx.Value(define.StatsContextKey).(*authzstats.AuthzStats)

    //Get IDC Provider for the customer
    logger, _ := reqCtx.Value(requestlogger.LoggerContextKey).(*requestlogger.RequestLogger)

    idcprovider, err := provider.GetIDCProvider(reqCtx, req, appId, accId)
    if err != nil {
    	logger.Log.Error("Error getting IdC providers", err)
    }

    if idcprovider != nil {
    	logger.Log.Info("IDC provider for appId : " + appId + " -> " + idcprovider.IdCAppArn)
    	//this Account has IdC providers
    	idcRedir := "/_login/IDPSelect.html?options=IAM,IAM Identity Center"
    	logger.Log.Debug("IdC redir to: ", idcRedir)
    	res.Redirect(req, idcRedir, reqStats.HttpStatus(http.StatusSeeOther))
    } else {
    	// No IdC provider available for the customer, redirect user to aws login page
    	// we support only nonFIPS redirection for Aosd dashboards
    	RedirectUsertoConsole(reqCtx, req, res, getConsoleEndpointForAosdApplication(appId, logger), redirectToDashboardURL, false)
    }

}

Then you are automatically logged in by calling AosdLogin

func (l *Login) HandleAosdLogin(reqCtx context.Context, req requestwrapper.RequestWrapper, res responsewrapper.ResponseWrapper) {
reqStats, \_ := reqCtx.Value(define.StatsContextKey).(*authzstats.AuthzStats)
logger, \_ := reqCtx.Value(requestlogger.LoggerContextKey).(\*requestlogger.RequestLogger)
logger.Log.Trace("login handler called")

    if !IsBrowser(req) {
    	res.SetStatus(reqStats.HttpStatus(http.StatusBadRequest))
    	return
    }

    /**
    Check if authorization header is present, if yes, then issue a session cookie and
    redirect to aosd home page
    */

    contextMap := getAosdRequestContext(req)
    PopulateVpceContext(req, contextMap)

    // IAM Authorization header
    authHeaders := req.GetHeader("Authorization")
    // IdC Authorization code after login
    idcAuthorizationCode := req.GetHeader(define.HeaderKeyIdcAuthorizationCode)
    if len(authHeaders) > 0 || len(idcAuthorizationCode) > 0 {
    	// Login request for aosd application. Login user with Sigv4 credentials and set the cookie in the browser
    	sessionCookie, err := l.Authn.GetSecuritySessionCookie(reqCtx, req, contextMap)
    	reqStats.AuthNCookieRequests += 1
    	authzstats.StatsEmitter.C.Count("authn.cookie.requests", 1, nil, 0.1)
    	if err != nil {
    		HandleCookieError(logger, req, res, reqStats, err)
    		return
    	}

    	reqStats.LoginAuthzOk += 1
    	authzstats.StatsEmitter.C.Count("requests.login.ok", 1, nil, 0.1)

    	SetSessionCookieKey(res, sessionCookie, req.GetHost(), true, true)

    	nextUrl := req.GetHeader("next-url")

    	if len(nextUrl) > 0 {
    		res.Redirect(req, nextUrl, reqStats.HttpStatus(http.StatusFound))
    		logger.Log.Debug("AOSD login handler done .. redirecting to ", nextUrl)
    	} else {
    		// Redirect user to AOSD home page
    		res.Redirect(req, define.AosdDefaultLandingPage, reqStats.HttpStatus(http.StatusFound))
    		logger.Log.Debug("AOSD login handler done .. redirecting to ", define.AosdDefaultLandingPage)
    	}
    	return
    }

    // Check if this is an IDC login error
    error_message := req.GetUrl().Query().Get("error")
    if error_message == "access_denied" {
    	res.Redirect(req, "/_login/unauthorized.html", reqStats.HttpStatus(http.StatusFound))
    	return
    }

    logger.Log.Debug("login handler found no Authorization header")
    // Just a plain request to get the login form
    matched, _ := regexp.MatchString(`^/_login(/)?$`, req.GetUrl().Path)
    if matched {
    	RedirectAosdDashboardsUser(reqCtx, req, res, l.Authn, req.GetHeader(define.HeaderKeyAmznAccountId), req.GetHeader(define.HeaderKeyAosdAppId), true)
    } else {
    	res.SetStatus(reqStats.HttpStatus(http.StatusOK))
    }

}

There are soem code change sthat you did earlie ront his branch -

src/plugins/data/public/search/errors/session_disconnect_error.tsx
src/plugins/data/public/search/search_interceptor.ts
please check them if they make sense else re do the task
also , we have to make this toaster globally o any page, but i will test it on discover,

currently i am doing in local so auth service like toekn and all would not make sense, so can you make a mock service which shuould tun a timer and the session api response can be tested, try to make this very minial changes o that when i will test it in testing env i dont have to make much changes,

look where in the plugin we have the auth api and session thing use them , and try to mark mock thing separately
