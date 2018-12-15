import Tone from 'tone';
import teoria from 'teoria';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}	

let step = 0
let key = 60
let rhythms = ["4n", "4t", "8n", "8t", "16n", "16t"]
let scaleNames = ["major", "minor", "dorian", "lydian", "mixolydian", "blues", "flamenco"]
let intervalNames = ["P1", "m2", "M2", "m3", "M3", "P4", "A4", "P5", "m6", "M6", "m7", "M7"]
let melody = [[0, 2, 4, 7],
			  [5, 7, 9, 12],
			  [11, 7, 4, 0],
			  [9, 5, 2, -1]]
let bass = [0, 5, 2, 7]
let chordSwitch = 0


class Music {

	constructor(){
		let that = this;

		this.crusher = new Tone.BitCrusher(8).toMaster();
		this.freeverb = new Tone.Freeverb(.7).toMaster();
		this.vibrato = new Tone.Vibrato().toMaster();
		this.stereo = new Tone.StereoWidener(.1).toMaster();
		this.delay = new Tone.FeedbackDelay("4n", 0.11).toMaster();

		this.drum1 = new Tone.MetalSynth({		 
			envelope : { 
		 	decay : .1,
		 	release : .1
		 	}, 
		 volume : -20
		}).toMaster();

		this.drum2 = new Tone.MembraneSynth({		 
			envelope : { 
		 	decay : .1,
		 	release : .5
		 	}, 
		volume : -10
		}).connect(that.crusher).toMaster();

		this.synth1 = new Tone.FMSynth({
			envelope  : {
				attack  : 0.01 ,
				decay  : 0.01 ,
				sustain  : .3 ,
				release  : 0.2
			}, 
			volume : -6
		}).chain(that.freeverb, that.delay).toMaster()

		this.plucky1 = new Tone.MonoSynth({
			oscillator : {
				type : 'sine'
		 },
		 envelope : {
		 	attack : .01,
		 	decay : .5,
		 	sustain : .1, 
		 	release : 6
		 	}, 
		 volume : -3
		}).chain(that.crusher, that.stereo).toMaster()

		this.plucky2 = new Tone.MonoSynth({
			oscillator : {
				type : 'sine'
		 },
		 envelope : {
		 	attack : .01,
		 	decay : .5,
		 	sustain : .1, 
		 	release : 6
		 	}, 
		 volume : -3
		}).connect(that.stereo).toMaster()

		this.loadLoop = new Tone.Loop(function(time){ 
			step++
			if (getRandomInt(20) < 10){
				that.drum1.frequency.value = getRandomInt(200)
				that.drum1.triggerAttackRelease("16n")
			}
			if (getRandomInt(20) < 10){
				that.drum2.triggerAttackRelease(getRandomInt(50), "16n")
			}
			if (step > 7){ 
				step = 0
				chordSwitch++
				if (chordSwitch > 3){
					chordSwitch = 0
				}
			}
			if (step == 0){
				that.plucky1.triggerAttackRelease(Tone.Midi(key + bass[chordSwitch] - 24).toNote(), "32n")
				that.plucky2.triggerAttackRelease(Tone.Midi(key + bass[chordSwitch] - 12).toNote(), "32n")
			}
			if (step%2 == 0){
				that.synth1.triggerAttackRelease(Tone.Midi(key + melody[chordSwitch][step/2]).toNote(), "32n")
			}
		}, "16n");
	}

	playLoadingMusic() {		
		let loadLoop = this.loadLoop;
		Tone.Transport.bpm.value = 100
		//Tone.Transport.swing = .5
		//Tone.Transport.swingSubdivision = "8n"
		Tone.Transport.start()
		// synths[1].triggerAttackRelease(Tone.Midi(48).toNote(), "32n") 
		// synths[1].triggerAttackRelease('C4', '4n', '8n')
		// synths[1].triggerAttackRelease('E4', '8n', Tone.Time('4n') + Tone.Time('8n'))
		// synths[1].triggerAttackRelease('G4', '16n', '2n')
		// synths[1].triggerAttackRelease('B4', '16n', Tone.Time('2n') + Tone.Time('8t'))
		// synths[1].triggerAttackRelease('G4', '16', Tone.Time('2n') + Tone.Time('8t')*2)
		// synths[1].triggerAttackRelease('E4', '2n', '0:3')
		this.scheduleID = Tone.Transport.scheduleRepeat(function(time){
			loadLoop.start();
			//loop.start(0);
		}, "1:0:0");
	}

	notLoading(){
		console.log("h")
		this.loadLoop.stop();
		Tone.Transport.clear(this.scheduleID);
	}
}

export default Music;