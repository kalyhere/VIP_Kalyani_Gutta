import os
import sys
import click

# Add the parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine
from backend.models import Base, User
from backend.auth import pwd_context

# Define valid apps
VALID_APPS = ['mcc', 'aimhei', 'suture']

def multi_select_apps():
    """Interactive multi-select for apps."""
    selected_apps = []
    click.echo("\nAvailable apps:")
    for i, app in enumerate(VALID_APPS, 1):
        click.echo(f"{i}. {app}")
    
    while True:
        selection = click.prompt(
            "\nEnter app numbers (comma-separated) or 'done' to finish",
            type=str,
            default='done'
        )
        
        if selection.lower() == 'done':
            break
            
        try:
            indices = [int(i.strip()) - 1 for i in selection.split(',')]
            for idx in indices:
                if 0 <= idx < len(VALID_APPS) and VALID_APPS[idx] not in selected_apps:
                    selected_apps.append(VALID_APPS[idx])
            click.echo(f"Currently selected: {', '.join(selected_apps)}")
        except ValueError:
            click.echo("Please enter valid numbers")
            continue
    
    return selected_apps

@click.group()
def cli():
    pass

@cli.command()
@click.option('--email', prompt='User email')
@click.option('--password', prompt=True, hide_input=True)
@click.option('--role', type=click.Choice(['user', 'admin']), prompt='User role')
@click.option('--apps', help='Comma-separated list of apps (will prompt if not provided)')
def create_user(email, password, role, apps):
    """Create a new user in the database."""
    if not apps:
        selected_apps = multi_select_apps()
        if not selected_apps:
            if not click.confirm("No apps selected. Do you want to continue?"):
                click.echo("Operation cancelled.")
                return
        apps = ','.join(selected_apps)
    else:
        # Validate provided apps
        app_list = [app.strip() for app in apps.split(',')]
        invalid_apps = [app for app in app_list if app not in VALID_APPS]
        if invalid_apps:
            click.echo(f"Error: Invalid apps provided: {', '.join(invalid_apps)}")
            click.echo(f"Valid apps are: {', '.join(VALID_APPS)}")
            return

    db = SessionLocal()
    try:
        user = User(
            email=email,
            hashed_password=pwd_context.hash(password),
            role=role,
            allowed_apps=apps.split(','),
            is_active=True
        )
        db.add(user)
        db.commit()
        click.echo(f"\nSuccessfully created user: {email}")
        click.echo(f"Role: {role}")
        click.echo(f"Allowed apps: {apps}")
    except Exception as e:
        click.echo(f"Error creating user: {str(e)}")
        db.rollback()
    finally:
        db.close()

@cli.command()
def list_users():
    """List all users in the database."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            click.echo(f"\nEmail: {user.email}")
            click.echo(f"Role: {user.role}")
            click.echo(f"Apps: {', '.join(user.allowed_apps)}")
    finally:
        db.close()

@cli.command()
@click.option('--email', prompt='User email to delete')
@click.option('--force', is_flag=True, help='Skip confirmation prompt')
def delete_user(email, force):
    """Delete a user from the database."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            click.echo(f"No user found with email: {email}")
            return

        if not force:
            if not click.confirm(f'Are you sure you want to delete user {email} ({user.role})?'):
                click.echo("Operation cancelled.")
                return

        db.delete(user)
        db.commit()
        click.echo(f"Successfully deleted user: {email}")
    except Exception as e:
        click.echo(f"Error deleting user: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    Base.metadata.create_all(bind=engine)
    cli() 