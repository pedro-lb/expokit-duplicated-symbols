# ExpoKit iOS build error: duplicated symbols for architecture x86_64

Repo to replicate the "duplicate symbols for architecture x86_64" happening in iOS build using XCode Version 11.3.1 (11C504). 

Expected behaviour on iOS build:

```
ld: 90 duplicate symbols for architecture x86_64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

You can find the full build error [here](https://pastebin.com/wLc1t1gJ).

## ℹ️ Steps to reproduce error after `git clone`:

 - Run `yarn install`.
 - Go into `ios` directory and run `pod install`: `cd ios && pod install`.
 - Start the expo server with `yarn start --clear`.
 - Open the project in XCode, click `Build` (or hit `⌘ + B`) 
 
 You should hit the error: `duplicate symbols for architecture x86_64`.


## ℹ️ Error details:

So this error started happening on our ExpoKit project after upgrading Expo's version. The project is using Expo SDK 36.0.0, and we're trying to build it with XCode Version 11.3.1 (11C504).

This repo simulates the problem by adding all the conflicting dependencies and trying to build.

After a few hours of tinkering we've found that these packages are conflicting with `ExpoKit`'s linked libraries:

```
@react-native-community/masked-view
react-native-screens
react-native-safe-area-context
```

## 💡 Solutions already attempted:

We've tried a few fixes as listed below.

### ❌ Upgrading to XCode 10's new build system:

Yeah, we're late to the party and still using the old build system. Although when trying to use the new one, the same error still happens and it doesn't build.

```
ld: 90 duplicate symbols for architecture x86_64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

### ❌ Manually removing conflics in `Podfile`:

We've tried to manually remove conflicting links on a `post-install hook` in our `Podfile`. The script looks as below.

The links were removed but that solution does not work. Same error happens (duplicate symbols for architecture x86_64).

```
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if %w(RNScreens RNCMaskedView react-native-safe-area-context).include?(target.name)
      target.remove_from_project
    end
  end
end
```

### ❌ Disabling `autolink` for conflicting dependencies on `react-native-config.js`:

By disabling React Native's autolink for the conflicting dependencies in `react-native-config.js` file, the project still does not build, and a new error appears.

```
module.exports = {
  dependencies: {
    ...,
    '@react-native-community/masked-view': {
      platforms: {
        ios: null,
      },
    },
    'react-native-safe-area-context': {
      platforms: {
        ios: null,
      },
    },
    'react-native-screens': {
      platforms: {
        ios: null,
      },
    },
  },
};
```

A new error happens when trying to build:

```
ld: library not found for -lRNCMaskedView
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

### ❌ Removing conflicting dependencies from `package.json`:

By removing the conflicting dependencies below from `package.json` and re-installing our modules and pods (by running the commands below).

```
yarn remove @react-native-community/masked-view react-native-screens react-native-safe-area-context

rm -rf node_modules yarn.lock

yarn install

cd ios

rm -rf Podfile.lock Pods

pod install

> build on XCode
```

On this repository, the project builds and works correctly! But I guess this happens since we don't really use these dependencies here (they were just installed via `yarn add`). On our project another error happens during build, since we actually import and use these dependencies:

```
ld: library not found for -lRNCMaskedView
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```


### ❌ Tinkering with XCode build settings:

We've tried to change a few XCode build settings as mentioned in a few Stack Overflow posts, but none of them worked.

- ❗ Removing `-ObjC` flag `Other Linker Flags` in XCode `Build Settings`: It builds! But doesn't work as stated in its topic below.
- 😵 Setting `No Common Blocks` to `NO` under `Build Settings`.
- 😵 Setting `Enable Testability` to `NO` under `Build Settings`.
- 😵 Running in production and debug modes.
- 😵 Removing `Link Binary with Libraries` under `Build Phases`.
- 😵 Removing duplicated (there were none) items in `Compile Sources` under `Build Phases`.
- 😵 Removing duplicated (there were none) libraries in `Libraries` folder in XCode.

### ❓ Removing `-ObjC` flag in `Other Linker Flags` under XCode's `Build Settings`:

By removing `-ObjC` flag from `Other Linker Flags` (located in `Build Settings`) on XCode, the project builds!

...but it immediately force-closes after opening 😞. The error below pops up.

```
*** Terminating app due to uncaught exception 'NSInvalidArgumentException', reason: '-[RCTRootView setReactTag:]: unrecognized selector sent to instance 0x7f84f6e10f40'
terminating with uncaught exception of type NSException
abort() called
CoreSimulator 681.17.2 - Device: iPhone 11 (0974E59B-9AA8-4E0B-915D-A083AB917955) - Runtime: iOS 13.3 (17C45) - DeviceType: iPhone 11
```

When looking at the exception that caused the app to crash with Mac OS `console`:

```
2020-01-17 14:35:13.414 [info][tid:main][RCTBridge.m:145] Class EXDisabledRedBox was not exported. Did you forget to use RCT_EXPORT_MODULE()?
```

Apparently, `-ObjC` is necessary to correctly build all the dependencies.

### ❌ Add React dependencies to `Podfile`:

When seeing the error above, while still without `-ObjC` flag in `Other Linker Flags` under XCode's `Build Settings`, we've tried adding the missing pods as described above (`Did you forget to use RCT_EXPORT_MODULE()?`) in our `Podfile`:

```
  pod 'React', :path => '../node_modules/react-native/'
  pod 'React-Core', :path => '../node_modules/react-native/React'
  pod 'React-DevSupport', :path => '../node_modules/react-native/React'
  pod 'React-fishhook', :path => '../node_modules/react-native/Libraries/fishhook'
  pod 'React-RCTActionSheet', :path => '../node_modules/react-native/Libraries/ActionSheetIOS'
  pod 'React-RCTAnimation', :path => '../node_modules/react-native/Libraries/NativeAnimation'
  pod 'React-RCTBlob', :path => '../node_modules/react-native/Libraries/Blob'
  pod 'React-RCTImage', :path => '../node_modules/react-native/Libraries/Image'
  pod 'React-RCTLinking', :path => '../node_modules/react-native/Libraries/LinkingIOS'
  pod 'React-RCTNetwork', :path => '../node_modules/react-native/Libraries/Network'
  pod 'React-RCTSettings', :path => '../node_modules/react-native/Libraries/Settings'
  pod 'React-RCTText', :path => '../node_modules/react-native/Libraries/Text'
  pod 'React-RCTVibration', :path => '../node_modules/react-native/Libraries/Vibration'
  pod 'React-RCTWebSocket', :path => '../node_modules/react-native/Libraries/WebSocket'
```

and we've also tried with:

```
pod 'React',
    :path => "../node_modules/react-native",
    :inhibit_warnings => true,
    :subspecs => [
      "Core",
      "ART",
      "RCTActionSheet",
      "RCTAnimation",
      "RCTCameraRoll",
      "RCTGeolocation",
      "RCTImage",
      "RCTNetwork",
      "RCTText",
      "RCTVibration",
      "RCTWebSocket",
      "DevSupport",
      "CxxBridge"
    ]
```

After running `rm -rf Podfile.lock Pods && pod install`, we've tried to build, but the same error happens.

```
2020-01-17 14:35:13.414 [info][tid:main][RCTBridge.m:145] Class EXDisabledRedBox was not exported. Did you forget to use RCT_EXPORT_MODULE()?
```


## 📚 References:

Below are the links we've visited for research and solutions we've tried. Unfortunately, none of them worked for us.

- https://github.com/pedro-lb/expo-36-react-native-music-control/issues/1
- https://github.com/tanguyantoine/react-native-music-control/issues/303
- https://github.com/expo/expo/issues/6230
- https://stackoverflow.com/questions/52206865/cocoapods-always-install-old-react-0-11-0
- https://stackoverflow.com/questions/56917963/react-native-ios-podfile-issue-with-use-native-modules
- https://stackoverflow.com/questions/28497957/adding-objc-flag-in-xcode
- https://github.com/facebook/react-native/issues/23886
- https://github.com/expo/expo/issues/2401
- https://forum.ionicframework.com/t/ios-221-duplicate-symbols-for-architecture-x86-64-clang-error-linker-command-failed-with-exit-code-1/175190/5
- https://forum.ionicframework.com/t/ios-221-duplicate-symbols-for-architecture-x86-64-clang-error-linker-command-failed-with-exit-code-1/175190
- https://stackoverflow.com/questions/35200074/xcode-7-2-clang-error-no-such-file-or-directory
- https://stackoverflow.com/questions/40010394/xcode-build-error-on-simulator-clang-error-no-such-file-or-directory-entit
- https://stackoverflow.com/questions/40034972/ionic-ld-framework-not-found-usernotifications
- https://stackoverflow.com/questions/14947139/xcodebuild-failure-clangerror-no-such-file-or-directory
- https://stackoverflow.com/questions/24298144/duplicate-symbols-for-architecture-x86-64-under-xcode/
- https://developer.apple.com/library/archive/qa/qa1490/_index.html
- https://stackoverflow.com/questions/46395751/ld-duplicate-symbols-for-architecture-x86-64-objc-class
- https://stackoverflow.com/questions/48005676/duplicate-symbols-for-architecture-x86-64-error-when-building-ios-application-in
- https://stackoverflow.com/questions/37457313/xcode-7-simulator-error-duplicate-symbols-for-architecture-x86-64
- https://github.com/nst/STTwitter/pull/189/files
- https://stackoverflow.com/questions/19533523/project-build-failed-in-xcode
- https://github.com/mauron85/react-native-background-geolocation/issues/318
- https://stackoverflow.com/questions/37928924/how-to-debug-unrecognized-selector-sent-to-instance/
- https://stackoverflow.com/questions/58830159/nsinvalidargumentexception-reason-uisearchbar-searchtextfield-unrecogni
- https://forums.expo.io/t/unable-to-ios-dev-menu-after-upgrading-to-sdk27-on-expokit/9883/11
- https://stackoverflow.com/questions/40460307/duplicate-symbol-error-when-adding-nsmanagedobject-subclass-duplicate-link
- https://stackoverflow.com/questions/26303782/duplicate-symbols-for-architecture-arm64
- https://github.com/ionic-team/ionic/issues/12942
- https://forums.expo.io/t/ios13-crashes-instantly-for-some-exc-bad-access-sigbus/28010/28
- https://stackoverflow.com/questions/58101444/xcode-11-crashing-on-iphone-13-1-app-running
- https://stackoverflow.com/questions/40393315/what-does-error-thread-1exc-bad-instruction-code-exc-i386-invop-subcode-0x0
- https://github.com/expo/expo/issues/5742
- https://forums.expo.io/t/expo-client-crashing-on-ios-13-with-sdk-v35/28680
- https://forums.expo.io/t/ios13-crashes-instantly-for-some-exc-bad-access-sigbus/28010
- https://stackoverflow.com/questions/41374955/react-native-fbsdk-unrecognized-selector-sent-to-instance
- https://stackoverflow.com/questions/39967378/unrecognized-selector-sent-to-instance-when-setting-a-property-on-react-native
- https://stackoverflow.com/questions/56913807/why-do-i-receive-unrecognized-selector-sent-to-instance-in-react-native-ios
- https://github.com/expo/expo/issues/230
- https://github.com/expo/expo/issues/5672
- https://stackoverflow.com/questions/57542336/cakeyframeanimation-setfromvalue-unrecognized-selector-sent-to-instance
- https://stackoverflow.com/questions/58131351/error-terminating-app-due-to-uncaught-exception-nsinvalidargumentexception
- https://stackoverflow.com/questions/36435471/terminating-app-due-to-uncaught-exception-nsinvalidargumentexception
- https://stackoverflow.com/questions/37388549/swift-terminating-app-due-to-uncaught-exception-nsinvalidargumentexception
- https://stackoverflow.com/questions/39196855/terminating-app-due-to-uncaught-exception-nsinvalidargumentexception-reason
- https://stackoverflow.com/questions/47172640/no-active-ios-device-found-when-trying-to-access-simulator-logs
- https://forums.expo.io/t/anybody-else-have-problems-with-ios-13-using-the-expokit-instructions-update-not-fixed/27139
- https://forums.expo.io/t/admob-rewarded-app-closes-instantly-ios-only/32040
- https://github.com/expo/expo/issues/5824
- https://forums.expo.io/t/sdk35-ios-facebook-login-doesnt-open-app/28567/5
- https://forums.expo.io/t/ios-standalone-app-keeps-crashing/27414/5
- https://forums.expo.io/t/app-crash-sdk34-in-ios13/28118/4
- https://stackoverflow.com/questions/41663002/react-rctbridgemodule-h-file-not-found
- https://stackoverflow.com/questions/44160993/xcode-error-the-app-id-cannot-be-registered-to-your-development-team
- https://stackoverflow.com/questions/51387873/xcode-couldnt-find-any-provisioning-profiles-matching
- https://github.com/expo/expo/issues/246
- https://github.com/expo/expo/issues/5733
- https://forums.expo.io/t/ios-app-unable-to-start-in-airplane-mode-with-sdk27/10477
- https://github.com/expo/expo/issues/1847
- https://forums.expo.io/t/app-quits-unexpectedly-on-ios-after-detach-but-works-fine-on-android/2518
- https://github.com/theliturgists/app/blob/25b452f5961bb207226860275046a02ecf0808ae/ios/Podfile
- https://stackoverflow.com/questions/27104946/duplicate-symbol-for-architecture-x86-64
- https://stackoverflow.com/questions/32111618/ld-2-duplicate-symbols-for-architecture-x86-64
- https://stackoverflow.com/questions/52168666/1159-duplicate-symbols-for-architecture-x86-64
- https://stackoverflow.com/questions/24298144/duplicate-symbols-for-architecture-x86-64-under-xcode
- https://medium.com/@nayabbutt1/google-maps-in-react-native-ios-application-3e27eece15b4
- https://stackoverflow.com/questions/48214603/duplicate-symbols-for-architecture-x86-64-ios-react-native
- https://stackoverflow.com/questions/42189494/solve-warning-no-rule-to-process-file-for-architecture-x86-64
- https://forums.expo.io/t/cant-build-detached-expokit-app-on-ios-simulator/13985/14
- https://github.com/facebook/react-native/issues/15838
- https://stackoverflow.com/questions/41477241/react-native-xcode-upgrade-and-now-rctconvert-h-not-found/41488258#41488258
- https://github.com/expo/expo/issues/5972
- https://forums.expo.io/t/cant-build-detached-expokit-app-on-ios-simulator/13985/3
- https://github.com/invertase/react-native-firebase/issues/2697
- https://github.com/invertase/react-native-firebase/issues/463
- https://stackoverflow.com/questions/48234417/react-native-ios-duplicate-symbols-i-e-duplicate-symbol-objc-metaclass-rct
- https://stackoverflow.com/questions/58692584/duplicate-symbols-between-react-native-and-gvrkit
- https://stackoverflow.com/questions/24298144/duplicate-symbols-for-architecture-x86-64-under-xcode?page=2&tab=Votes
- https://stackoverflow.com/questions/39732017/xcode-ld-275-duplicate-symbols-for-architecture-arm64-clang-error-linker-com?noredirect=1&lq=1
- https://github.com/facebook/react-native/issues/25484
- https://github.com/facebook/react-native/issues/23613
- https://stackoverflow.com/questions/42021796/react-native-xcode-project-product-archive-fails-with-duplicate-symbols-for-arch
- https://github.com/react-native-community/react-native-maps/issues/718
- https://stackoverflow.com/questions/39732017/xcode-ld-275-duplicate-symbols-for-architecture-arm64-clang-error-linker-com
https://stackoverflow.com/questions/48214603/duplicate-symbols-for-architecture-x86-64-ios-react-native/
