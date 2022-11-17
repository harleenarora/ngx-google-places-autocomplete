import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, Output} from "@angular/core";
import {Address} from "./objects/address";
import {Options} from "./objects/options/options";

declare let google: any;

@Directive({
    selector: '[ngx-google-places-autocomplete]',
    exportAs: 'ngx-places'
})

export class GooglePlaceDirective implements AfterViewInit {
    @Input('options') options: Options;
    @Output() onAddressChange: EventEmitter<Address> = new EventEmitter();
    private autocomplete: any;
    private eventListener: any;
    public place: Address;

    constructor(private el: ElementRef, private ngZone: NgZone) {
    }

    ngAfterViewInit(): void {
        if (!this.options)
            this.options = new Options();

        this.initialize();
    }

    private isGoogleLibExists(): boolean {
        return !(!google || !google.maps || !google.maps.places);
    }

    private initialize(): void {
        let googleLibExists = this.isGoogleLibExists();
		if(!googleLibExists){
			throw new Error("Google maps library can not be found");
		}
		var _this = this;
        this.el.nativeElement.addEventListener('keyup', (event: any) => {
            if(event.target.value.length > 2){
				if(googleLibExists){
					if(!_this.autocomplete){
						_this.autocomplete = new google.maps.places.Autocomplete(_this.el.nativeElement, _this.options);
					}
					if (!_this.autocomplete)
						throw new Error("Autocomplete is not initialized");
					if (!_this.autocomplete.addListener != null) {
						_this.eventListener = _this.autocomplete.addListener('place_changed', function () {
							_this.handleChangeEvent();
						});
					}
				}
			} else {
				if(_this.autocomplete){
					const elements = document.getElementsByClassName('pac-container');
					if((Object.keys(elements)).length > 0){
						while(elements.length > 0){
							elements[0].parentNode.removeChild(elements[0]);
						}
					}
					new google.maps.event.clearListeners(_this.el.nativeElement);
					_this.autocomplete = undefined;
				}
			}
            if(!event.key) {
                return;
            }

            let key = event.key.toLowerCase();

            if (key == 'enter' && event.target === this.el.nativeElement) {
                event.preventDefault();
                event.stopPropagation();
            }
        });

        // according to https://gist.github.com/schoenobates/ef578a02ac8ab6726487
        if (window && window.navigator && window.navigator.userAgent && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
            setTimeout(() => {
                let containers = document.getElementsByClassName('pac-container');

                if (containers) {
                    let arr = Array.from(containers);

                    if (arr) {
                        for (let container of arr) {
                            if (!container)
                                continue;

                            container.addEventListener('touchend', (e) => {
                                e.stopImmediatePropagation();
                            });
                        }

                    }
                }
            }, 500);
        }
    }

    public reset(): void {
        this.autocomplete.setComponentRestrictions(this.options.componentRestrictions);
        this.autocomplete.setTypes(this.options.types);
    }

    private handleChangeEvent(): void {
        this.ngZone.run(() => {
            this.place = this.autocomplete.getPlace();

            if (this.place) {
                this.onAddressChange.emit(this.place);
            }
        });
    }
}
