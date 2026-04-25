import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HealthStatusComponent } from './features/health/health-status.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HealthStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Greenfield';
}
