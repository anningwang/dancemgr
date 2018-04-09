import MarkerModel from './MarkerModel';

export default MarkerModel.extend({

    type: 'markLine',

    defaultOption: {
        zlevel: 0,
        z: 5,

        symbol: ['circle', 'arrow'],
        symbolSize: [8, 16],

        //symbolRotate: 0,

        precision: 2,
        tooltip: {
            trigger: 'item'
        },
        label: {
            show: true,
            position: 'end'
        },
        lineStyle: {
            type: 'dashed'
        },
        emphasis: {
            label: {
                show: true
            },
            lineStyle: {
                width: 3
            }
        },
        animationEasing: 'linear'
    }
});