import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
export interface Languages {
  LanguageName: string,
  Code: string
}

declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  recognition: any = new webkitSpeechRecognition();
  isStoppedSpeechRecog: boolean = false;
  text: string = '';
  tempWords: string = '';
  serviceRunning: boolean = false;
  languages: Languages[] = [
    {
      LanguageName: 'English (United States)',
      Code: 'en-US'
    },
    {
      LanguageName: 'தமிழ் (Tamil)',
      Code: 'ta-IN'
    },
    {
      LanguageName: 'española (Spanish)',
      Code: 'es-ES'
    },
    {
      LanguageName: 'Français (French)',
      Code: 'fr-FR'
    },
    {
      LanguageName: 'Deutsch (German)',
      Code: 'de-DE'
    },
    {
      LanguageName: '中国人 (China)',
      Code: 'zh-CN'
    },
    {
      LanguageName: '日本語 (Japan)',
      Code: 'ja-JP'
    },
    {
      LanguageName: 'عربي (Arabic)',
      Code: 'ar-SA'
    }
  ]
  selectedLanguage: string = this.languages[0].Code;
  selectedFile: File | undefined;
  selectedFileName: string = '';
  processing: boolean = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.recognition.interimResults = true;
    this.recognition.lang = this.selectedLanguage;
    this.recognition.addEventListener('result', (e: any) => {
      const transcript = Array.from(e.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      this.tempWords = transcript;
      console.log(transcript);
    });
  }

  onSelectionChange(event: any){
    this.recognition.lang = event.value;
  }

  startService() {
    if (!this.serviceRunning) {
      this.processing = true;
      this.serviceRunning = true;
      this.isStoppedSpeechRecog = false;
      this.recognition.start();
      this.recognition.addEventListener('end', (condition: any) => {
        if (this.isStoppedSpeechRecog) {
          this.recognition.stop();
          console.log('End speech recognition!');
        } 
        else {
          this.wordConcat();
          this.recognition.start();
        }
      });
    }
    else {
      console.log('Service already running!');
    }
  }

  stopService() {
    this.processing = false;
    this.serviceRunning = false;
    this.isStoppedSpeechRecog = true;
    this.wordConcat();
    this.recognition.stop();
  }

  wordConcat() {
    this.text = this.text + ' ' + this.tempWords + '.';
    this.tempWords = '';
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if(this.selectedFile != undefined){
      this.selectedFileName = this.selectedFile.name;
    }
  }

  async onUpload(): Promise<void> {
    const formData = new FormData();
    if(this.selectedFile != undefined){
      this.processing = true;
      formData.append('audio', this.selectedFile);
      formData.append('languageCode', this.recognition.lang);
      try {
        const response = await this.http.post<any>('http://localhost:3000/convert', formData).toPromise();
        this.text = response.transcription;
        this.processing = false;
      } catch (error) {
        console.error('Error:', error);
        this.processing = false;
      }
    }
  }
}