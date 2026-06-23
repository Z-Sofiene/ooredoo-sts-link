import { Component, OnInit } from '@angular/core';
import { GestionChefTechService } from '../gestion-chef-tech.service';
import {Router} from '@angular/router';
//import { MatDialog } from '@angular/material/dialog';



@Component({
  selector: 'app-dashboard-chef-tech',
  templateUrl: './dashboard-chef-tech.component.html',
  styleUrls: ['./dashboard-chef-tech.component.css']
})
export class DashboardChefTechComponent implements OnInit {
  name!: string;
  email!: string;
  role!: string;
  avatarUrl: string = 'assets/default-avatar.png';
  isLoading = false;

  // Dialog states
  showFeedbackDialog = false;
  showProfileDialog = false;

  // Feedback form
  feedback = {
    type: 'message',
    subject: '',
    message: ''
  };

  // Profile update form
  profileUpdate = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    photo: null as File | null
  };

  constructor(
    private gest: GestionChefTechService,
    private router: Router,
  ) {}
  //private dialog: MatDialog  << inside constrcutor

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData(): void {
    this.isLoading = true;

    this.email = this.gest.getEmailFromToken();
    this.name = this.formatName(this.gest.getNameFromToken());
    this.role = this.formatRole(this.gest.getRoleFromToken());
    this.checkLoading();
    // Load user avatar if available
    this.loadUserAvatar();
  }

  private checkLoading(): void {
    // Simple loading check - in real app you might want to use more sophisticated logic
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  private formatRole(role: string): string {
    switch(role) {
      case 'CHEF': return 'Chef d\'Équipe';
      case 'TECH': return 'Technicien';
      default: return role;
    }
  }

  private formatName(name: string): string {
    // Assuming name comes as "FirstName LastName"
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return name;
  }

  private loadUserAvatar(): void {
    // You would typically load this from your service
    // For now, we'll use a default or placeholder
    this.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name || 'User')}&background=3b82f6&color=fff&size=150`;
  }

  downloadApk(): void {
    const apk = 'sts-pro.apk';
    const apkUrl = this.gest.downloadLink(apk);
    if (apkUrl != null) {
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = 'sts-pro.apk';
      link.target = '_blank';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

  }


  private showDownloadConfirmation(): void {
    // You can implement a toast or snackbar here
    console.log('Starting APK download...');
  }

  openFeedbackDialog(): void {
    this.showFeedbackDialog = true;
  }

  closeFeedbackDialog(): void {
    this.showFeedbackDialog = false;
    this.resetFeedbackForm();
  }
/*
  submitFeedback(): void {
    if (!this.feedback.message.trim()) {
      // Show validation error
      return;
    }

    this.isLoading = true;

    // Call your service to submit feedback
    this.gest.submitFeedback(this.feedback).subscribe({
      next: (response) => {
        console.log('Feedback submitted:', response);
        this.isLoading = false;
        this.closeFeedbackDialog();
        // Show success message
      },
      error: (err) => {
        console.error('Error submitting feedback:', err);
        this.isLoading = false;
        // Show error message
      }
    });
  }
*/
  openProfileUpdateDialog(): void {
    this.showProfileDialog = true;
  }

  closeProfileDialog(): void {
    this.showProfileDialog = false;
    this.resetProfileForm();
  }
/*
  updateProfile(): void {
    // Validate passwords match
    if (this.profileUpdate.newPassword !== this.profileUpdate.confirmPassword) {
      // Show validation error
      return;
    }

    this.isLoading = true;

    // Create form data for file upload
    const formData = new FormData();
    if (this.profileUpdate.photo) {
      formData.append('photo', this.profileUpdate.photo);
    }
    if (this.profileUpdate.currentPassword) {
      formData.append('currentPassword', this.profileUpdate.currentPassword);
    }
    if (this.profileUpdate.newPassword) {
      formData.append('newPassword', this.profileUpdate.newPassword);
    }

    // Call your service to update profile
    this.gest.updateProfile(formData).subscribe({
      next: (response) => {
        console.log('Profile updated:', response);
        this.isLoading = false;
        this.closeProfileDialog();

        // Reload user data if photo was updated
        if (this.profileUpdate.photo) {
          this.loadUserAvatar();
        }
        // Show success message
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.isLoading = false;
        // Show error message
      }
    });
  }
*/
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
        this.profileUpdate.photo = file;

        // Preview image
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.avatarUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // Show error message
        console.error('Invalid file. Please select an image under 5MB.');
      }
    }
  }
/*
  triggerPasswordReset(): void {
    this.isLoading = true;

    this.gest.requestPasswordReset(this.email).subscribe({
      next: (response: any) => {
        console.log('Password reset requested:', response);
        this.isLoading = false;
        // Show success message with instructions
      },
      error: (err: any) => {
        console.error('Error requesting password reset:', err);
        this.isLoading = false;
        // Show error message
      }
    });
  }
*/
  private resetFeedbackForm(): void {
    this.feedback = {
      type: 'message',
      subject: '',
      message: ''
    };
  }

  private resetProfileForm(): void {
    this.profileUpdate = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      photo: null
    };
  }

  /*
  // Using Material Dialog (alternative approach)
  openFeedbackDialogMaterial(): void {
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: '500px',
      data: { email: this.email, name: this.name }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        console.log('Feedback submitted via dialog:', result);
      }
    });
  }
*/
  /*
  openUpdateProfileDialogMaterial(): void {
    const dialogRef = this.dialog.open(UpdateProfileDialogComponent, {
      width: '500px',
      data: {
        email: this.email,
        name: this.name,
        avatarUrl: this.avatarUrl
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        console.log('Profile update via dialog:', result);
        // Handle profile update
      }
    });
  }

   */

  logout(): void {
    // Show confirmation dialog
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.isLoading = true;
      this.isLoading = false;
      this.showLogoutMessage();
      setTimeout(() => {
        this.gest.logout();
        this.router.navigate(['/login']);
      }, 1500);
    }
  }

  private showLogoutMessage(): void {
    // You can implement a toast/snackbar here
    console.log('Déconnexion réussie');

    // Or show a temporary message on the screen
    const messageDiv = document.createElement('div');
    messageDiv.textContent = '👋 Déconnexion réussie...';
    messageDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    color: white;
    padding: 1.5rem 2.5rem;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1.2rem;
    z-index: 9999;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    animation: fadeOut 1.5s ease-in-out forwards;
  `;

    document.body.appendChild(messageDiv);

    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(messageDiv);
    }, 1500);
  }

// Add this to your component's CSS or create a keyframe

}
