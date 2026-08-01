import base64
import json
import os
import secrets
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Query
# pyrefly: ignore [missing-import]
from fastapi.responses import HTMLResponse, RedirectResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from jose import jwt, JWTError

from app import models, schemas
from app.database import get_db
from app.crud import crud_user
from app.dependencies import get_current_user
from app.utils.auth import (
    SECRET_KEY, 
    ALGORITHM, 
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    create_access_token, 
    get_password_hash
)

# Optional dependencies for real OAuth
try:
    # pyrefly: ignore [missing-import]
    import httpx
except ImportError:
    httpx = None


router = APIRouter(
    prefix="/auth",
    tags=["oauth"],
)

# Helper to verify token for linking
def get_user_from_token(token: str, db: Session) -> Optional[models.User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return crud_user.get_user_by_username(db, username=username)
    except JWTError:
        return None

def is_mock_mode(provider: str) -> bool:
    """
    Returns True if provider credentials are not set, meaning we should run in simulation.
    """
    if provider == "google":
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    elif provider == "github":
        client_id = os.getenv("GITHUB_CLIENT_ID")
        client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    else:
        return True
    
    # If variables are missing or set to placeholder/empty values, run in mock mode
    return not client_id or not client_secret or client_id.strip() == "" or client_secret.strip() == ""

@router.get("/connections", response_model=List[schemas.OAuthConnectionResponse])
def get_connections(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the user's active connection states.
    """
    connected_providers = {conn.provider: conn for conn in current_user.oauth_connections}
    
    response = []
    for provider in ["google", "github"]:
        conn = connected_providers.get(provider)
        response.append(
            schemas.OAuthConnectionResponse(
                provider=provider,
                connected=conn is not None,
                email=conn.provider_email if conn else None,
                username=conn.provider_username if conn else None,
            )
        )
    return response

@router.delete("/connections/{provider}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_provider(
    provider: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnects (deletes) the connection for the specified provider.
    """
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
        
    connection = db.query(models.UserOAuthConnection).filter(
        models.UserOAuthConnection.user_id == current_user.id,
        models.UserOAuthConnection.provider == provider
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail=f"No connection found for {provider}")
        
    db.delete(connection)
    db.commit()
    return

@router.get("/mock-consent", response_class=HTMLResponse)
def mock_consent(
    provider: str,
    state: str,
):
    """
    Renders a simulated consent screen for developers testing locally.
    """
    provider_name = "Google" if provider == "google" else "GitHub"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>HoloVault - Connect Account</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            body {{
                background-color: #030712;
                color: #f3f4f6;
                font-family: 'Outfit', sans-serif;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow: hidden;
                position: relative;
            }}
            .glow {{
                position: absolute;
                width: 400px;
                height: 400px;
                background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%);
                border-radius: 50%;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1;
                pointer-events: none;
            }}
            .card {{
                background: rgba(17, 24, 39, 0.7);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                padding: 40px;
                width: 100%;
                max-width: 420px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                z-index: 10;
                text-align: center;
            }}
            h1 {{
                font-size: 28px;
                font-weight: 800;
                margin: 0 0 10px 0;
                background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            p.subtitle {{
                font-size: 14px;
                color: #9ca3af;
                margin-bottom: 30px;
            }}
            .profile-btn {{
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 14px;
                width: 100%;
                color: #e5e7eb;
                font-size: 15px;
                font-weight: 600;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 12px;
            }}
            .profile-btn:hover {{
                background: rgba(59, 130, 246, 0.1);
                border-color: rgba(59, 130, 246, 0.4);
                transform: translateY(-1px);
            }}
            .profile-btn .avatar {{
                width: 32px;
                height: 32px;
                background: #2563eb;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 800;
            }}
            .profile-btn .info {{
                display: flex;
                flex-direction: column;
            }}
            .profile-btn .email {{
                font-size: 11px;
                color: #6b7280;
                font-weight: 400;
            }}
            .divider {{
                margin: 24px 0;
                display: flex;
                align-items: center;
                text-align: center;
                color: #4b5563;
                font-size: 12px;
            }}
            .divider::before, .divider::after {{
                content: '';
                flex: 1;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }}
            .divider:not(:empty)::before {{ margin-right: .5em; }}
            .divider:not(:empty)::after {{ margin-left: .5em; }}
            .custom-form {{
                display: flex;
                flex-direction: column;
                gap: 12px;
                text-align: left;
            }}
            .input-group {{
                display: flex;
                flex-direction: column;
                gap: 6px;
            }}
            .input-group label {{
                font-size: 12px;
                color: #9ca3af;
                font-weight: 600;
            }}
            .input-group input {{
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 10px 14px;
                color: #f3f4f6;
                font-size: 14px;
                outline: none;
                transition: all 0.2s ease;
            }}
            .input-group input:focus {{
                border-color: #3b82f6;
                background: rgba(255, 255, 255, 0.05);
            }}
            .submit-btn {{
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                padding: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
                margin-top: 8px;
            }}
            .submit-btn:hover {{
                opacity: 0.9;
            }}
        </style>
    </head>
    <body>
        <div class="glow"></div>
        <div class="card">
            <h1>Authorize {provider_name} Connection</h1>
            <p class="subtitle">Select a mock profile to authorize this request with HoloVault.</p>
            
            <button class="profile-btn" onclick="selectProfile('ash_ketchum', 'ash@pallettown.com', 'mock_{provider}_ash')">
                <div class="avatar" style="background: #2563eb;">AK</div>
                <div class="info">
                    <span>Ash Ketchum</span>
                    <span class="email">ash@pallettown.com</span>
                </div>
            </button>
            <button class="profile-btn" onclick="selectProfile('misty_w', 'misty@ceruleangym.com', 'mock_{provider}_misty')">
                <div class="avatar" style="background: #ec4899;">MW</div>
                <div class="info">
                    <span>Misty Waterflower</span>
                    <span class="email">misty@ceruleangym.com</span>
                </div>
            </button>
            <button class="profile-btn" onclick="selectProfile('brock_h', 'brock@pewtergym.com', 'mock_{provider}_brock')">
                <div class="avatar" style="background: #eab308;">BH</div>
                <div class="info">
                    <span>Brock Harrison</span>
                    <span class="email">brock@pewtergym.com</span>
                </div>
            </button>

            <div class="divider">or use custom profile</div>

            <form class="custom-form" onsubmit="handleCustom(event)">
                <div class="input-group">
                    <label>Username</label>
                    <input type="text" id="custom-username" placeholder="e.g. red_champion" required />
                </div>
                <div class="input-group">
                    <label>Email Address</label>
                    <input type="email" id="custom-email" placeholder="e.g. red@kanto.com" required />
                </div>
                <button type="submit" class="submit-btn">Authorize Custom Profile</button>
            </form>
        </div>

        <script>
            const state = "{state}";
            const provider = "{provider}";
            
            function selectProfile(username, email, id) {{
                const data = {{ username, email, id }};
                const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
                const callbackUrl = `/api/v1/auth/${{provider}}/callback?code=mock_code_${{base64}}&state=${{state}}`;
                window.location.href = callbackUrl;
            }}

            function handleCustom(e) {{
                e.preventDefault();
                const username = document.getElementById('custom-username').value.trim();
                const email = document.getElementById('custom-email').value.trim();
                const id = 'mock_' + provider + '_' + Math.random().toString(36).substring(2, 11);
                selectProfile(username, email, id);
            }}
        </script>
    </body>
    </html>
    """
    return html_content

@router.get("/{provider}/login")
def oauth_login(
    provider: str,
    flow: str = "login", # "login" or "link"
    token: Optional[str] = None, # User token if flow == "link"
):
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
        
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # State holds flow, token (if any) and a random nonce
    nonce = secrets.token_hex(8)
    state = f"{flow}__{token or ''}__{nonce}"
    
    # Check if we should use mock flow
    if is_mock_mode(provider):
        return RedirectResponse(
            url=f"/api/v1/auth/mock-consent?provider={provider}&state={state}"
        )
        
    # Real OAuth Flow Redirection
    redirect_uri = f"http://localhost:8000/api/v1/auth/{provider}/callback"
    
    if provider == "google":
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"state={state}"
        )
    else:  # github
        client_id = os.getenv("GITHUB_CLIENT_ID")
        url = (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope=read:user%20user:email&"
            f"state={state}"
        )
        
    return RedirectResponse(url=url)

@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
        
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Parse state
    parts = state.split("__")
    flow = parts[0]
    link_token = parts[1] if len(parts) > 1 else ""
    
    # Retrieve profile data (Mock vs Real)
    provider_user_id = None
    provider_email = None
    provider_username = None
    
    if code.startswith("mock_code_"):
        try:
            # Decode mock profile data
            b64_str = code[len("mock_code_"):]
            decoded_bytes = base64.b64decode(b64_str)
            profile = json.loads(decoded_bytes.decode("utf-8"))
            
            provider_user_id = profile["id"]
            provider_email = profile["email"]
            provider_username = profile["username"]
        except Exception as e:
            return RedirectResponse(url=f"{frontend_url}/?error=Failed+to+decode+mock+oauth+profile")
    else:
        # Real OAuth Exchange
        if not httpx:
            return RedirectResponse(url=f"{frontend_url}/?error=httpx+library+not+installed")
            
        redirect_uri = f"http://localhost:8000/api/v1/auth/{provider}/callback"
        
        try:
            async with httpx.AsyncClient() as client:
                if provider == "google":
                    # Token exchange
                    token_res = await client.post(
                        "https://oauth2.googleapis.com/token",
                        data={
                            "code": code,
                            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                            "redirect_uri": redirect_uri,
                            "grant_type": "authorization_code"
                        }
                    )
                    token_data = token_res.json()
                    access_token = token_data.get("access_token")
                    if not access_token:
                        return RedirectResponse(url=f"{frontend_url}/?error=Google+auth+failed")
                        
                    # Fetch User Info
                    userinfo_res = await client.get(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        headers={"Authorization": f"Bearer {access_token}"}
                    )
                    user_data = userinfo_res.json()
                    
                    provider_user_id = str(user_data.get("sub"))
                    provider_email = user_data.get("email")
                    provider_username = user_data.get("name", "").replace(" ", "_").lower()
                    if not provider_username:
                        provider_username = provider_email.split("@")[0]
                        
                else: # github
                    # Token exchange
                    token_res = await client.post(
                        "https://github.com/login/oauth/access_token",
                        data={
                            "client_id": os.getenv("GITHUB_CLIENT_ID"),
                            "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
                            "code": code,
                            "redirect_uri": redirect_uri
                        },
                        headers={"Accept": "application/json"}
                    )
                    token_data = token_res.json()
                    access_token = token_data.get("access_token")
                    if not access_token:
                        return RedirectResponse(url=f"{frontend_url}/?error=GitHub+auth+failed")
                        
                    # Fetch Profile Info
                    userinfo_res = await client.get(
                        "https://api.github.com/user",
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "User-Agent": "HoloVault-App"
                        }
                    )
                    user_data = userinfo_res.json()
                    provider_user_id = str(user_data.get("id"))
                    provider_username = user_data.get("login")
                    provider_email = user_data.get("email")
                    
                    # If email is private, fetch user emails
                    if not provider_email:
                        emails_res = await client.get(
                            "https://api.github.com/user/emails",
                            headers={
                                "Authorization": f"Bearer {access_token}",
                                "User-Agent": "HoloVault-App"
                            }
                        )
                        emails_data = emails_res.json()
                        # Get primary email
                        for email_entry in emails_data:
                            if email_entry.get("primary"):
                                provider_email = email_entry.get("email")
                                break
                                
                    if not provider_email:
                        provider_email = f"{provider_username}@github.oauth"
                        
        except Exception as e:
            return RedirectResponse(url=f"{frontend_url}/?error=OAuth+handshake+failed:+{str(e)}")
            
    # Process account routing based on Flow
    if flow == "link":
        # Check logged-in user
        current_user = get_user_from_token(link_token, db)
        if not current_user:
            return RedirectResponse(url=f"{frontend_url}/?error=Session+expired+while+linking")
            
        # Check if this connection is already linked to anyone
        existing_conn = db.query(models.UserOAuthConnection).filter(
            models.UserOAuthConnection.provider == provider,
            models.UserOAuthConnection.provider_user_id == provider_user_id
        ).first()
        
        if existing_conn:
            if existing_conn.user_id == current_user.id:
                # Already linked to this user, just redirect success
                return RedirectResponse(url=f"{frontend_url}/?linked=true&provider={provider}")
            else:
                return RedirectResponse(url=f"{frontend_url}/?error=Account+already+linked+to+another+user")
                
        # Link it to current user
        new_conn = models.UserOAuthConnection(
            user_id=current_user.id,
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            provider_username=provider_username
        )
        db.add(new_conn)
        db.commit()
        return RedirectResponse(url=f"{frontend_url}/?linked=true&provider={provider}")
        
    else: # login / registration flow
        # Try to find existing connection
        connection = db.query(models.UserOAuthConnection).filter(
            models.UserOAuthConnection.provider == provider,
            models.UserOAuthConnection.provider_user_id == provider_user_id
        ).first()
        
        user = None
        if connection:
            user = connection.user
        else:
            # Check if user with that email already exists
            user = crud_user.get_user_by_email(db, email=provider_email)
            if user:
                # User exists - automatically link this provider
                new_conn = models.UserOAuthConnection(
                    user_id=user.id,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    provider_email=provider_email,
                    provider_username=provider_username
                )
                db.add(new_conn)
                db.commit()
            else:
                # Create a new user from scratch
                # Ensure unique username
                base_username = provider_username
                unique_username = base_username
                counter = 1
                while crud_user.get_user_by_username(db, username=unique_username):
                    unique_username = f"{base_username}{counter}"
                    counter += 1
                    
                # Generate a random password since they authenticate via OAuth
                random_pass = secrets.token_hex(16)
                hashed_pass = get_password_hash(random_pass)
                
                user = models.User(
                    username=unique_username,
                    email=provider_email,
                    hashed_password=hashed_pass
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # Link OAuth connection to the newly created user
                new_conn = models.UserOAuthConnection(
                    user_id=user.id,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    provider_email=provider_email,
                    provider_username=provider_username
                )
                db.add(new_conn)
                db.commit()
                
        # Generate token for user
        from datetime import timedelta
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Redirect user back to frontend with login credentials
        redirect_url = f"{frontend_url}/?token={access_token}&username={user.username}&user_id={user.id}"
        return RedirectResponse(url=redirect_url)
