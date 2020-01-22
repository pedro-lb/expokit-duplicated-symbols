# expokit-duplicated-symbols
Repo to replicate the "duplicate symbols for architecture x86_64" happening in iOS build using XCode Version 11.3.1 (11C504). 

## Steps to reproduce error after `git clone`
 - Run `yarn install`.
 - Go into `ios` directory and run `pod install`: `cd ios && pod install`.
 - Start the expo server with `yarn start --clear`.
 - Open the project in XCode, click `Build` (or hit `⌘ + B`) 
 - Error: `duplicate symbols for architecture x86_64`.

Expected behaviour on iOS build:

```
ld: 90 duplicate symbols for architecture x86_64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

After a few hours of tinkering we've found that these packages are conflicting with `ExpoKit`'s linked libraries:

```
@react-native-community/masked-view
react-native-screens
react-native-safe-area-context
```


## Error details & Solutions already attempted

So we're having this error on our ExpoKit project. The project is using Expo SDK 36.0.0, and we're trying to build it with XCode Version 11.3.1 (11C504).

After upgrading Expo version this error started happening, and we've tried a few fixes as listed below.

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

### ❌ Tinkering with XCode build settings:

We've tried to change a few XCode build settings as mentioned in a few Stack Overflow posts, but none of them worked.

- ❗ Removing `-ObjC` flag `Other Linker Flags` in XCode `Build Settings`. It builds! But doesn't work as stated in its topic below.
- 😵 Setting `No Common Blocks` to `NO` under `Build Settings`.
- 😵 Setting `Enable Testability` to `NO` under `Build Settings`.
- 😵 Running in production and debug modes.
- 😵 Removing `Link Binary with Libraries` under `Build Phases`.
- 😵 Removing duplicated (there were none) items in `Compile Sources` under `Build Phases`.
- 😵 Removing duplicated (there were none) libraries in `Libraries` folder in XCode.

### ❓ Removing `-ObjC` flag `Other Linker Flags` in XCode `Build Settings`:

By removing `-ObjC` flag from `Other Linker Flags` (located in `Build Settings`) on XCode, the project builds! 

...but it immediately force-closes after opening 😞. 

The error below pops up. Apparently, `-ObjC` is necessary to correctly build all the dependencies.

```
*** Terminating app due to uncaught exception 'NSInvalidArgumentException', reason: '-[RCTRootView setReactTag:]: unrecognized selector sent to instance 0x7f84f6e10f40'
terminating with uncaught exception of type NSException
abort() called
CoreSimulator 681.17.2 - Device: iPhone 11 (0974E59B-9AA8-4E0B-915D-A083AB917955) - Runtime: iOS 13.3 (17C45) - DeviceType: iPhone 11
```
