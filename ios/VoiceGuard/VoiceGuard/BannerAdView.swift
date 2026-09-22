import GoogleMobileAds
import SwiftUI

struct BannerAdView: View {
    var body: some View {
        GeometryReader { proxy in
            let width = max(320, min(proxy.size.width, 600))
            let adSize = largeAnchoredAdaptiveBanner(width: width)

            BannerViewContainer(adSize: adSize)
                .frame(width: adSize.size.width, height: adSize.size.height)
                .frame(maxWidth: .infinity)
        }
        .frame(height: 100)
        .accessibilityLabel("広告")
    }
}

private struct BannerViewContainer: UIViewRepresentable {
    let adSize: AdSize

    func makeUIView(context: Context) -> BannerView {
        let banner = BannerView(adSize: adSize)
        banner.adUnitID = Bundle.main.object(forInfoDictionaryKey: "VGAdMobBannerUnitID") as? String
        banner.delegate = context.coordinator
        banner.load(Request())
        return banner
    }

    func updateUIView(_ banner: BannerView, context: Context) {
        banner.adSize = adSize
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, BannerViewDelegate {
        func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
#if DEBUG
            print("AdMob banner failed: \(error.localizedDescription)")
#endif
        }
    }
}
